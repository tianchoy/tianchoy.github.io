# flutter父子传值StatefulWidget和StatelessWidget的区别


父组件：

```dart
ElevatedButton(
          onPressed: () {
            Navigator.of(context).push(MaterialPageRoute(
                builder: (context) => FormPage(title: 'form page!')));
          },
          style: ButtonStyle(
              padding: MaterialStateProperty.all(
                  const EdgeInsets.fromLTRB(20, 10, 20, 10))),
          child: const Text('传值按钮'),
        )
```

子组件的StatelessWidget模式：

```dart
class FormPage extends StatelessWidget {
  late String title;
  FormPage({Key? key, this.title = "form"}) : super(key: key);
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
      ),
      body: ListView(
        children: const [
          ListTile(
            title: Text('表单内容'),
          )
        ],
      ),
    );
  }
}
```
子组件的StatefulWidget模式：

```dart
class FormPage extends StatefulWidget {
  String title;
  FormPage({Key? key, required this.title}) : super(key: key);

  @override
  // ignore: no_logic_in_create_state
  State<FormPage> createState() => _FormPageState(title: title);
}

class _FormPageState extends State<FormPage> {
  String title;
  _FormPageState({required this.title});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
      ),
      body: ListView(
        children: const [
          ListTile(
            title: Text('表单内容'),
          )
        ],
      ),
    );
    ;
  }
}
```
