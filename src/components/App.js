import React, { Component } from 'react';
import Web3 from 'web3'
import logo from '../logo.png';
import './App.css';
import Marketplace from '../abis/Marketplace.json'
import Navbar from './Navbar'
import Main from './Main'

class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3
    // Load account
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
    const networkId = await web3.eth.net.getId()
    const networkData = Marketplace.networks[networkId]
    if (networkData) {
      const marketplace = new web3.eth.Contract(Marketplace.abi, networkData.address)
      console.log(marketplace + typeof(marketplace))
      this.setState({ marketplace });
      const productCount = await marketplace.methods.productCount().call()
      this.setState({ productCount });
      console.log(productCount.toString())
      
      // Load products
      for (var i = 1; i <= productCount; i++) {
        const product = await marketplace.methods.products(i).call()
        this.setState({
          products: [...this.state.products, product]
        })
      }
      this.setState({ loading: false })
    } else {
      window.alert('Marketplace contract not deployed to detected network.')
    }
  }

  async createProduct(name, price) {
    this.setState({ loading: true })
    await this.state.marketplace.methods.createProduct(name, price).send({ from: this.state.account })
      .on('receipt', async (receipt) => {
        console.log(receipt);
        const product = receipt.events.ProductCreated.returnValues;
        this.setState({
          products: [...this.state.products, product]
        })
        this.setState({ loading: false });
      })
      .on('transactionHash', function(hash){
        console.log(hash);
      })
      .on('confirmation', function(confirmationNumber, receipt){
        console.log(confirmationNumber);
      })
      .on('error', async (err,receipt) => {
        console.log(err);
        this.setState({ loading: false });
      })
  }

  async purchaseProduct(id, price) {
    this.setState({ loading: true })
    await this.state.marketplace.methods.purchaseProduct(id).send({ from: this.state.account, value: price })
      .on('receipt', (receipt) => {
        this.setState({ loading: false })
        let products = [...this.state.products];
        let product = receipt.events.ProductPurchased.returnValues;
        products[product.id] = product;
        this.setState({ products: products });
      })
      .on('error',async (err)=>{
        console.log(err);
        this.setState({ loading: false })
      })
  }

  constructor(props) {
    super(props)
    this.state = {
      marketplace: {},
      account: '',
      productCount: 0,
      products: [],
      loading: true
    }
    this.createProduct = this.createProduct.bind(this)
    this.purchaseProduct = this.purchaseProduct.bind(this)
  }


  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              {this.state.loading
                ? <div id="loader" className="text-center"><p className="text-center">Loading...</p></div>
                : <Main
                    products={this.state.products} 
                    createProduct={this.createProduct}
                    purchaseProduct={this.purchaseProduct}
                    />
              }
              {/* <div className="content mr-auto ml-auto">
                <a
                  href="http://www.dappuniversity.com/bootcamp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src={logo} className="App-logo" alt="logo" />
                </a>
                <h1>Dapp University Starter Kit</h1>
                <p>
                  Edit <code>src/components/App.js</code> and save to reload.
                </p>
                <a
                  className="App-link"
                  href="http://www.dappuniversity.com/bootcamp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LEARN BLOCKCHAIN <u><b>NOW! </b></u>
                </a>
              </div> */}
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;