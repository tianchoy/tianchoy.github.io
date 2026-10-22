---
title: "React 父子组件传值"
date: 2025-04-15T16:41:16+08:00
categories: ["react"]
tags: ["react"]
draft: false
---


在 React 中，父子组件传值方式：

## 1. 父组件向子组件传值（Props）

这是最基础的传值方式，通过 props 将数据从父组件传递给子组件。

```jsx
// 父组件
function ParentComponent() {
  const [message, setMessage] = useState('Hello from Parent');
  
  return (
    <div>
      <ChildComponent greeting={message} />
    </div>
  );
}

// 子组件
function ChildComponent(props) {
  return <h1>{props.greeting}</h1>;
}

// 或者使用解构
function ChildComponent({ greeting }) {
  return <h1>{greeting}</h1>;
}
```

## 2. 子组件向父组件传值（回调函数）

通过父组件传递回调函数给子组件，子组件调用该函数并传递数据。

```jsx
// 父组件
function ParentComponent() {
  const [childData, setChildData] = useState('');
  
  const handleChildData = (data) => {
    setChildData(data);
  };
  
  return (
    <div>
      <p>Data from child: {childData}</p>
      <ChildComponent onSendData={handleChildData} />
    </div>
  );
}

// 子组件
function ChildComponent({ onSendData }) {
  const handleClick = () => {
    onSendData('Data from Child');
  };
  
  return <button onClick={handleClick}>Send Data to Parent</button>;
}
```

## 3. 使用 Context API 跨层级传值

对于深层嵌套组件，可以使用 Context 避免 prop drilling。

```jsx
// 创建 Context
const MyContext = React.createContext();

// 父组件
function ParentComponent() {
  return (
    <MyContext.Provider value={{ message: 'Hello from Context' }}>
      <ChildComponent />
    </MyContext.Provider>
  );
}

// 子组件（可以是任意层级的子组件）
function ChildComponent() {
  const context = useContext(MyContext);
  
  return <h1>{context.message}</h1>;
}
```

## 4. 使用 Refs 访问子组件实例

在需要直接访问子组件方法或 DOM 元素时使用。

```jsx
// 父组件
function ParentComponent() {
  const childRef = useRef(null);
  
  const handleClick = () => {
    childRef.current.childMethod();
  };
  
  return (
    <div>
      <button onClick={handleClick}>Call Child Method</button>
      <ChildComponent ref={childRef} />
    </div>
  );
}

// 子组件需要使用 forwardRef
const ChildComponent = forwardRef((props, ref) => {
  useImperativeHandle(ref, () => ({
    childMethod: () => {
      console.log('Child method called');
    }
  }));
  
  return <div>Child Component</div>;
});
```

## 最佳实践

1. 优先使用 props 和回调函数进行简单通信
2. 对于深层嵌套组件考虑使用 Context
3. 谨慎使用 refs，避免破坏 React 的数据流
4. 对于复杂状态管理，可以考虑使用状态管理库（如 Redux、MobX 等）

React 的数据流是单向的，从父组件流向子组件，反向通信需要通过回调函数实现。