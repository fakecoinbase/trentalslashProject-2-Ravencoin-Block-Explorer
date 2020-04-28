import React, { Component } from 'react';
import './App.css';
import { Route, Link } from 'react-router-dom';
import Home from './components/Home/Home';
import Transaction from './components/Transaction/Transaction';
import Block from './components/Block/Block';

const numTransactions = 10;
const numBlocks = 5;
class App extends Component {
	constructor(props) {
		super(props);

		this.state = {
			transactions: [],
			transaction: '',
			blocks: [],
			block: { tx: [] }, // include tx array for render before data load
			search: '',
		};
	}

	addTransaction(newTransaction) {
		const newTransactionsList = [newTransaction, ...this.state.transactions];

		// remove transactions if more than 10 in the list
		while (newTransactionsList.length > numTransactions) {
			newTransactionsList.pop();
		}

		this.setState({ transactions: newTransactionsList });
	}

	addBlock(newBlockData) {
		const newBlocksList = [newBlockData, ...this.state.blocks];

		// remove blocks if more than wanted in the list
		while (newBlocksList.length > numBlocks) {
			newBlocksList.pop();
		}

		this.setState({
			blocks: newBlocksList,
		});
	}

	setBlock(blockHash) {
		// this.setState({ block: blockHeight });
		this.getBlockByHash(blockHash)
			.then((blockData) => this.setState({ block: blockData }))
			.catch((error) => console.error(error));
	}

	getTransaction(txHash) {
		// returns transaction data based on transaction id
		return new Promise((resolve, reject) => {
			const transactionURL = 'https://ravenexplorer.net/api/tx/';
			fetch(transactionURL + txHash)
				.then((response) => response.json())
				.then((data) => {
					resolve(data);
				})
				.catch((error) => {});
		});
	}

	setTransaction(txid) {
		this.getTransaction(txid)
			.then((txData) => this.setState({ transaction: txData }))
			.catch((error) => console.error(error));
	}

	getBlockByHeight(blockHeight) {
		// returns block hash based on eight
		return new Promise((resolve, reject) => {
			const blockHeightURL = 'https://ravenexplorer.net/api/block-index/';
			fetch(blockHeightURL + blockHeight)
				.then((response) => response.json())
				.then((data) => {
					resolve(data.blockHash);
				})
				.catch((error) => {});
		});
	}

	getBlockByHash(blockHash) {
		// returns block detail when looking up by hash
		return new Promise((resolve, reject) => {
			const blockHashURL = 'https://ravenexplorer.net/api/block/';
			fetch(blockHashURL + blockHash)
				.then((response) => response.json())
				.then((data) => {
					resolve(data);
				})
				.catch((error) => {});
		});
	}

	addFiveMostRecentBlocks() {
		const statusURL = 'https://ravenexplorer.net/api/status';
		let currentHeight = 0;
		let currentApp = this;

		fetch(statusURL)
			.then((response) => response.json())
			.then((data) => {
				currentHeight = data.info.blocks;
				this.getBlockByHeight(currentHeight - 4)
					.then((blockHash) => {
						this.getBlockByHash(blockHash)
							.then((blockData) => this.addBlock(blockData))
							.catch((error) => console.log(error));
					})
					.catch((error) => console.log(error));
				currentApp
					.getBlockByHeight(currentHeight - 3)
					.then((blockHash) => {
						currentApp
							.getBlockByHash(blockHash)
							.then((blockData) => currentApp.addBlock(blockData))
							.catch((error) => console.log(error));
					})
					.catch((error) => console.log(error));
				currentApp
					.getBlockByHeight(currentHeight - 2)
					.then((blockHash) => {
						currentApp
							.getBlockByHash(blockHash)
							.then((blockData) => currentApp.addBlock(blockData))
							.catch((error) => console.log(error));
					})
					.catch((error) => console.log(error));
				currentApp
					.getBlockByHeight(currentHeight - 1)
					.then((blockHash) => {
						currentApp
							.getBlockByHash(blockHash)
							.then((blockData) => currentApp.addBlock(blockData))
							.catch((error) => console.log(error));
					})
					.catch((error) => console.log(error));
				currentApp
					.getBlockByHeight(currentHeight)
					.then((blockHash) => {
						currentApp
							.getBlockByHash(blockHash)
							.then((blockData) => currentApp.addBlock(blockData))
							.catch((error) => console.log(error));
					})
					.catch((error) => console.log(error));
			})
			.catch((error) => {
				console.error(error);
			});
	}

	io() {
		// this lazy function does nothing
		// but satisfies React when React wants to find a this.io function before
		// loading the websocket stuff
	}

	componentDidMount() {
		// get five last blocks and populate state
		this.addFiveMostRecentBlocks();

		// create web socket
		const script = document.createElement('script');
		script.src = 'https://ravenexplorer.net/socket.io/socket.io.js';
		script.async = true;
		document.body.appendChild(script);

		let originalThis = this;

		setTimeout(function () {
			const room = 'inv';

			// react really doesn't like this unless there is a lazy this.io function above
			const socket = this.io('https://ravenexplorer.net');

			socket.on('connect', function () {
				// Join the room.
				socket.emit('subscribe', room);
			});
			socket.on('tx', function (txData) {
				originalThis
					.getTransaction(txData.txid)
					.then((txData) => originalThis.addTransaction(txData))
					.catch((error) => {});
			});
			socket.on('block', function (blockHash) {
				originalThis
					.getBlockByHash(blockHash)
					.then((blockData) => originalThis.addBlock(blockData))
					.catch((error) => {});
			});
		}, 500); // delay here so that the socket js file can be loaded from remote
	}

	handleChange(event) {
		this.setState(
			{ [event.target.name]: event.target.value },
			this.speculativeSearch
		);
	}

	speculativeSearch() {
		console.log(this.state.search);
		this.getBlockByHash(this.state.search)
			.then((data) => console.log(data))
			.catch((error) => {});
		this.getTransaction(this.state.search)
			.then((data) => console.log(data))
			.catch((error) => {});
		if (typeof this.state.search === 'number') {
			this.getBlockByHeight(this.state.search)
				.then((blockHash) => {
					this.getBlockByHash(blockHash)
						.then((blockData) => console.log(blockData))
						.catch((error) => {});
				})
				.catch((error) => {});
		}
	}

	render() {
		return (
			<div>
				<nav>
					<input
						placeholder='Search'
						onChange={this.handleChange.bind(this)}
						name='search'></input>
				</nav>
				<main>
					<Route
						path='/'
						exact
						render={(routerProps) => (
							<Home
								transactions={this.state.transactions}
								blocks={this.state.blocks}
							/>
						)}
					/>
					<Route
						path='/tx/:txHash'
						render={(routerProps) => {
							return (
								<Transaction
									match={routerProps.match}
									setTransaction={this.setTransaction.bind(this)}
									transaction={this.state.transaction}
								/>
							);
						}}
					/>
					<Route
						path='/block/:blockHash'
						render={(routerProps) => {
							return (
								<Block
									match={routerProps.match}
									setBlock={this.setBlock.bind(this)}
									block={this.state.block}
								/>
							);
						}}
					/>
				</main>
			</div>
		);
	}
}
export default App;

//const socket = io("https://ravenexplorer.net");
