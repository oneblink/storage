const fn = ({ name }: { name: string }) => {
  console.log(name)
}

class MyClass {
  name: string
  constructor({ name }: { name: string }) {
    this.name = name
  }

  readName() {
    fn({ ...this })
  }
}

const run = () => {
  const cl = new MyClass({ name: 'Zachary' })
  cl.readName()
}
run()
