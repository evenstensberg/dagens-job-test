import { Component} from 'react';

class App extends Component {

  submitProduct = async (e) => {
    e.preventDefault();
    const payload = {
      name: e.target[0].value,
      price: e.target[1].value,
      category: e.target[2].value
    }
    const response = await fetch("http://localhost:3001/create-product", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const jsonResponse = await response.json() // Do something
  }
  render() {
    return(
      <div className="app">
      <form onSubmit={this.submitProduct}>
        <label>
          Name
      <input type="text" name="name" />
        </label>
        <label>
          Price
      <input type="text" name="price" />
        </label>
        <label>
          Category
      <input type="text" name="category" />
        </label>
        <input type="submit" value="Submit" />
      </form>
    </div>
    )
  }
}

export default App;
