# https 通信过程

6 月 10, 2022 • ☕️☕️☕️ 20 min read

在经过了 TCP 三次握手以后，通信的双方已经建立了「可靠」的连接，如果通信双方使用的是 https 协议的话，还要经过 SSL/TLS 建立「安全」的连接，本文将通过 WiresShark 抓包来详细看下 https 建立链接的过程。

在开始之前，我们首先了解一下秘钥交换算法。

## RSA 协商算法

RSA 算法的流程比较简单，首先服务端发送自己的公钥给客户端。然后客户端生成一个 **秘钥 key**，通过服务端的公钥进行加密后传输给服务端。最后服务端通过私钥解密 **秘钥 key**。经过上述流程，服务端和客户端就能交换好 **秘钥 key**，最终通过 **秘钥 key** 进行加密会话。

![rsa](/https-handshake/rsa.jpg)

虽然 RSA 算法比较简单，而且性能较好，但是 RSA 算法不具备前向安全性，因为 **秘钥 key** 的交换过于依赖服务端公钥私钥的加密解密，如果后续服务端的私钥被泄露，之前加密过的数据仍然存在被解密的可能，因此现在很少被服务器使用。

## ECDHE 协商算法

ECDHE 算法的出现就是为了解决前向安全性问题，ECDHE 协商算法是建立在「**离散对数问题很困难**」的基础上的。即公式 H = dG，知道 d 和 G 可以很容易的计算出 H，但是知道 H 和 G 推算出 d 是很困难的，让我们看下 ECDHE 算法的过程：

- 首先通信双方确定好使用的椭圆曲线，和曲线上的一个基点 G。

- 服务端生成私钥 d1 ,并且通过公式 H = dG 得出公钥 H1，将公钥 H1 发送给客户端。

- 客户端生成私钥 d2 ,并且通过公式 H = dG 得出公钥 H2，将公钥 H2 发送给服务端。

- 这时服务端拥有自己的私钥 d1 和客户端的公钥 H2，客户端拥有自己的私钥 d2 和服务端的公钥 H1。

- 通过乘法分配律 S = d1H2 = d1(d2G) = d2(d1G) = d2H1，所以通信双方求得的 S 是相同的，这个 S 也就是后续加密用到的预主钥。

![ecdhe](/https-handshake/ecdhe.jpg)

通过流程可以看到，虽然中间人无法通过基点 G 和公钥 H 推算出最终的预主钥 S，但是他可以完全伪造通信的双方，自己生成私钥 d 和公钥 H 与双方进行通信，这时就需要证书来证明通信的双方是没有被劫持的。在 ECDHE 算法中，服务器的私钥公钥只是用来验证签名判断有没有中间人劫持，而最终的秘钥不再依赖服务器的私钥的加密，就算后续服务器私钥泄露也不会对之前加密过的信息产生泄露，这就是所谓的前向安全性。

## HTTPS

在了解了 RSA 和 ECDHE 算法以后，我们来通过抓包详细的看一下 HTTPS 是如何应用的。宏观上来看，可以大致分为五步。

1. Client Hello
2. Server Hello
3. Certificate、Server Key Exchange、Server Hello Done
4. Client Key Exchange、Change Cipher Spec、Encrypted Handshake Message
5. New Session Ticket、Change Cipher Spec、Encrypted Handshake Message

![all](/https-handshake/all.jpg)

## 1、Client Hello

客户端通过发起 Client Hello 报文开始 SSL/TLS 通信，这个报文主要包含了客户端支持的 **TLS 的版本**、用于生成最终会话秘钥的 **随机数 (Client Random)**、用于复用 https 连接和断线重连的 **SessionId**、供服务端进行选择的 **加密套件列表 (Cipher Suites)**。

![first](/https-handshake/first.jpg)

## 2、Server Hello

服务端在接受到 Client Hello 报文以后会回应一个 Server Hello 报文，这个报文和 Client Hello 报文相似，包含了和客户端相同的 **TLS 的版本**、用于生成最终会话秘钥的 **随机数 (Server Random)**、选择好的 **加密套件**，通过加密套件的内容 TLS\_**ECDHE**\_RSA_WITH_AES_128_GCM_SHA256，可以看出这次 TLS 的秘钥协商算法使用的是 「**ECDHE**」。

![second](/https-handshake/second.jpg)

## 3、第三次握手

第三步服务端一共发送了 Certificate、Server Key Exchange、Server Hello Done 三条信息给客户端，我们单独看一下这三条信息都包含了什么内容。

![third](/https-handshake/third.jpg)

### 1、Certificate

服务端将自己的 CA 证书发送给客户端，证书包含服务器的公钥和签名，客户端拿到 CA 证书后通过签名验证证书是否合法，如果证书合法就说明没有被中间人劫持并修改。

### 2、Server Key Exchange

这个报文就是 ECDHE 算法的主要内容，可以看到服务端选取了名称为 named_curve 的椭圆曲线。然后服务端生成 ECDHE 私钥，并且根据选择的椭圆曲线提供的基点 G，生成服务端 ECDHE 公钥 PubKey，然后通过服务器私钥对 PubKey 生成一个签名 Signature，打包发送给客户端。（这里注意服务端私钥和服务端 ECDHE 私钥不是一个东西。）

![server_key_change](/https-handshake/server_key_change.jpg)

### 3、Server Hello Done

代表服务端已经将所有信息发送给客户端了。

## 4、第四次握手

第四步客户端一共发送了 Client Key Exchange、Change Cipher Spec、Encrypted Handshake Message 三条信息给服务端，我们单独看一下这三条信息都包含了什么内容。

![forth](/https-handshake/forth.jpg)

### 1、Client Key Exchange

在收到服务端发来的报文后，客户端首先会验证证书是否合法，如果证书合法则提取证书里的服务端公钥，然后对服务端 PubKey 的签名做验证，如果验证通过就说明没有被第三方篡改，然后生成客户端私钥，并且根据服务端选择的椭圆曲线和基点 G 生成客户端公钥 PubKey 发送给服务端。

![client_key_change](/https-handshake/client_key_change.jpg)

到这里，客户端已经拥有了自己的客户端 ECDHE 私钥、基点 G、服务端 ECDHE 公钥，通过公式 S = d1H2 = d1(d2G) = d2(d1G) = d2H1 就可以计算出预主钥 S。然后通过客户端随机数、服务端随机数、预主钥 S 生成最终对称加密的秘钥 key。

### 2、Change Cipher Spec

这个消息的作用是通知服务端后续可以使用对称加密来进行通话了。

### 3、Encrypted Handshake Message

这个报文的目的就是告诉对端自己在整个握手过程中收到了什么数据，发送了什么数据。来保证中间没人篡改报文

## 5、第五次握手

在收到第四次握手客户端发来的客户端公钥以后，服务端也拥有了自己的服务端 ECDHE 私钥、基点 G、客户端 ECDHE 公钥，通过公式 S = d1H2 = d1(d2G) = d2(d1G) = d2H1 就可以计算出预主钥 S。然后通过客户端随机数、服务端随机数、预主钥 S 生成最终对称加密的秘钥 key。

然后服务端会发送与第四次握手类似的消息通知客户端自己已经拿到对称加密的秘钥 key，后续可以通过对称加密进行通信了。New Session Ticket 与 Session Id 的作用类似，也是用来重用 Session 来提高 https 的性能的。

![fifth](/https-handshake/fifth.jpg)

## 一次安全的通信

在经历的 TCP 三次握手和 TLS 五次握手以后，通信双方终于建立了「可靠」「安全」的连接，可以开始进行通信了。

![end](/https-handshake/end.jpg)
