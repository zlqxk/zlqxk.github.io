# 如何使用 vscode 中的 debug 功能

4 月 14, 2022 • ☕️☕️☕️ 10 min read

断点调试能够帮助我们很清晰的了解整个代码的执行流程，例如我们在阅读 react 源码的过程中，一边断点一边阅读会使整个 react 执行流程更加清晰，在上文我们已经搭建了一个 react 源码的调试环境，接下来我们来看一下如果进行断点调试。

## 启动项目

这步不用多说，将我们搭建好的 react 调试项目跑起来。

## 开启 debug

在 vscode 左侧找到 debug 的开关，点击运行和调试，选择要调试的环境，这里我们选择 chrome。

![debug-position](/how-use-vscode-debug/debug-position.png)

## 设置要调试的端口号

在选择了 chrome 以后，会自动在我们根目录下生成一个 launch.json 文件，这个文件存储这 debug 用到的配置，这里我们将 url 改成我们调试项目的端口号。

![debug-url](/how-use-vscode-debug/debug-url.png)

到这里我们就已经设置好了，让我们回到上一步，重新点击运行和调试，接下来就会自动打开一个 chrome 页面，如果成功打开就说明我们的配置已经没有问题了。

## 开始断点调试

现在我们就可以在入口的地方打上一个断点，点下刷新按钮，这时候代码的执行就会被断点停住，然后我就可以通过点击下一步来一步步调试 react 源码了。

![debug-use](/how-use-vscode-debug/debug-use.png)

## debug 信息

在左侧我们就可以看到当前执行的上下文对象的变量，包括当前的调用堆栈，通过点击调用堆栈里的函数，可以很容易的查看每一步执行的函数，避免了在海量的代码里找来找去。

![debug-info](/how-use-vscode-debug/debug-info.png)

在有了调试环境和 debug 的加持，我们就可以相对轻松的阅读 react 的源码了，下文我们将介绍一下 react 的主要执行流程。
