import * as React from "react";
import { ethers } from "ethers";
import './App.css';
import abi from './utils/WavePortal.json'

export default function App() {

  const [currAccount, setCurrentAccount] = React.useState("")
  const [allWaves, setAllWaves] = React.useState([])
  const [tweetValue, setTweetValue] = React.useState("")
  const contractAddress = `0x92c723748D3480505dAd661322c8F3b0f395fbbF`
  const contractABI = abi.abi

  const checkIfWalletIsConnected = () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log(`Make sure you have Metamask!`);
      return;
    } else {
      console.log(`We have the ethereum object`, ethereum);
    }

    ethereum.request({ method: 'eth_accounts' })
      .then(accounts => {
        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log(`Found an authorised account : ${account}`)
          setCurrentAccount(account)
          getAllWaves();
        } else {
          console.log(`No authorised account found`)
        }
      })
  }

  const connectWallet = () => {
    const { ethereum } = window;
    if (!ethereum) {
      alert('Get metamask!')
    }
    ethereum.request({ method: 'eth_requestAccounts' })
      .then(accounts => {
        console.log(`Connected ${accounts[0]}`)
        setCurrentAccount(accounts[0])
      })
      .catch(err => console.log(err));
  }

  const wave = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner()
    const waveportalContract = new ethers.Contract(contractAddress, contractABI, signer);

    let count = await waveportalContract.getTotalWaves();
    console.log(`Retrieved total wave count... ${count.toNumber()}`)

    const waveTxn = await waveportalContract.wave(tweetValue,{gasLimit:300000})
    console.log(`Mining... ${waveTxn.hash}`)
    await waveTxn.wait()
    console.log(`Mined-- ${waveTxn.hash}`)

    count = await waveportalContract.getTotalWaves();
    console.log(`Retrieved total wave count... ${count.toNumber()}`)
  }

  const getAllWaves = async() =>{
    const {ethereum} = window;
    try{
      if(window.ethereum){
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner()
        const waveportalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waves = await waveportalContract.getAllWaves();

        const wavesCleaned = waves.map((wave)=>{
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          }
        })
        console.log(`cleaned : ${wavesCleaned}`)
        setAllWaves(wavesCleaned);
      }else{
        console.log("Ethereum object doesn't exist!")
      }
    }catch(error){
      console.log(error);
    }

  }

  React.useEffect(() => {
    checkIfWalletIsConnected()
  }, [])

  React.useEffect(()=>{
    let waveportalContract;
    let onNewWave;

      if(window.ethereum){
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner()
      waveportalContract = new ethers.Contract(contractAddress, contractABI, signer);
      onNewWave = (from, timestamp,message)=>{
        console.log("NewWave",from,timestamp,message);
        setAllWaves(prevState => [...prevState,{
              address:from,
              timestamp:new Date(timestamp*1000),
              message:message
        }])
      }
        waveportalContract.on("NewWave",onNewWave);
      }
      return () =>{
        if(waveportalContract){
          waveportalContract.off("NewWave", onNewWave)
        }
      }
  },[])

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          0xTwitter 🐦
        </div>

        <div className="bio">
          This is a website for sending anonymous tweets. This is just a barebone project and lack any advance features. But you can surely tweet anything you feel like:) Also some lucky person might get some ETH on tweeting!<hr />
          <span style={{color:'Purple'}}>You must be connected to Metamask (Rinkeby test network) to tweet.</span>
          <br /><br />
          <span style={{color:'Red'}}>*Retweet time is set to 10 mins to prevent spam.</span>
        </div>
        <br /><br />

        {
          currAccount ? (<textarea name="tweetArea"
            placeholder="type your tweet"
            type="text"
            id="tweet"
            value={tweetValue}
            onChange={e => setTweetValue(e.target.value)} />) : null
        }

        <button className="waveButton" onClick={wave}>
          Press to Tweet
        </button>

        { currAccount ? null : (<button className="waveButton" onClick={connectWallet}>Connect Wallet</button>)
        }

        {
          allWaves.map((wave, index) => {
            return (
              <div style={{ backgroundColor: 'white', marginTop: '16px', padding: '10px', borderRadius: '10px', borderLeftColor: 'orange', borderRightColor: 'green', borderStyle: 'solid', borderTopColor: 'red', borderBottomColor: 'blue' }} key={wave.timestamp}>
                <div>Address: {wave.address}</div>
                <div>Time: {wave.timestamp.toString()}</div>
                <div>Message: {<span style={{ color: 'blue' }}>{wave.message}</span>}</div>
              </div>
            )
          })
        }

      </div>
    </div>
  );
}