# 控制反转和依赖注入

6 月 15, 2022 • ☕️☕️☕️ 5 min read

## 控制反转

控制反转是一种设计思想，可以用来降低代码之间的耦合度，例如我们在 Class A 中用到了 Class B 的对象 b，一般情况下，需要在 A 的代码中显式地用 new 建立 B 的对象。

```ts
class Person {}

class Boy {
  person: Person

  constructor() {
    // 显式实例化
    this.person = new Person()
  }
}
```

采用依赖注入技术之后，A 的代码只需要定义一个 private 的 B 对象，不需要直接 new 来获得这个对象，而是通过相关的容器控制程序来将 B 对象在外部 new 出来并注入到 A 类里的引用中。

```ts
class Person {}

class Boy {
  person: Person

  constructor(private readonly person: Person) {}
}
```

## 依赖注入

依赖注入是实现控制反转的一种方式，例如上述例子，可以看到并没有实例化的代码，实例化对象的工作其实交给了控制反转的容器，然后通过依赖注入的方式提供给使用这个对象的地方。
