import './App.css';
import React, { useEffect, useState, useReducer } from 'react';
import Web3 from 'web3';
import { MDBCollapse, MDBBtn, MDBRow, MDBCol } from 'mdb-react-ui-kit';
import { useTranslation, Trans } from 'react-i18next';

const lngs = { // 언어 구분을 위한 lng 객체 생성
  ko: { nativeName: "한국어" },
  ch: { nativeName: '中文' },
  en: { nativeName: 'English' },
};

let lotteryAddress = '0x78539654028fb27a910F66D2b208B96Ce4e5cAb1';
let lotteryABI = [ { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "index", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "bettor", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes1", "name": "challenges", "type": "bytes1" }, { "indexed": false, "internalType": "uint256", "name": "answerBlockNumber", "type": "uint256" } ], "name": "BET", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "index", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "bettor", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes1", "name": "challenges", "type": "bytes1" }, { "indexed": false, "internalType": "bytes1", "name": "answer", "type": "bytes1" }, { "indexed": false, "internalType": "uint256", "name": "answerBlockNumber", "type": "uint256" } ], "name": "DRAW", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "index", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "bettor", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes1", "name": "challenges", "type": "bytes1" }, { "indexed": false, "internalType": "bytes1", "name": "answer", "type": "bytes1" }, { "indexed": false, "internalType": "uint256", "name": "answerBlockNumber", "type": "uint256" } ], "name": "FAIL", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "index", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "bettor", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes1", "name": "challenges", "type": "bytes1" }, { "indexed": false, "internalType": "uint256", "name": "answerBlockNumber", "type": "uint256" } ], "name": "REFUND", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "index", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "bettor", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes1", "name": "challenges", "type": "bytes1" }, { "indexed": false, "internalType": "bytes1", "name": "answer", "type": "bytes1" }, { "indexed": false, "internalType": "uint256", "name": "answerBlockNumber", "type": "uint256" } ], "name": "WIN", "type": "event" }, { "inputs": [], "name": "answerForTest", "outputs": [ { "internalType": "bytes32", "name": "", "type": "bytes32" } ], "stateMutability": "view", "type": "function", "constant": true }, { "inputs": [], "name": "owner", "outputs": [ { "internalType": "address payable", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function", "constant": true }, { "inputs": [], "name": "getSomeValue", "outputs": [ { "internalType": "uint256", "name": "value", "type": "uint256" } ], "stateMutability": "pure", "type": "function", "constant": true }, { "inputs": [], "name": "getPot", "outputs": [ { "internalType": "uint256", "name": "pot", "type": "uint256" } ], "stateMutability": "view", "type": "function", "constant": true }, { "inputs": [ { "internalType": "bytes1", "name": "challenges", "type": "bytes1" } ], "name": "Bet_Distribute", "outputs": [ { "internalType": "bool", "name": "result", "type": "bool" } ], "stateMutability": "payable", "type": "function", "payable": true }, { "inputs": [ { "internalType": "bytes1", "name": "challenges", "type": "bytes1" } ], "name": "Bet", "outputs": [ { "internalType": "bool", "name": "result", "type": "bool" } ], "stateMutability": "payable", "type": "function", "payable": true }, { "inputs": [], "name": "Distribute", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "bytes32", "name": "answer", "type": "bytes32" } ], "name": "SetTestMode", "outputs": [ { "internalType": "bool", "name": "result", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "bytes1", "name": "challenges", "type": "bytes1" }, { "internalType": "bytes32", "name": "answer", "type": "bytes32" } ], "name": "CompareNumber", "outputs": [ { "internalType": "enum Lottery.BettingResult", "name": "", "type": "uint8" } ], "stateMutability": "pure", "type": "function", "constant": true }, { "inputs": [ { "internalType": "uint256", "name": "index", "type": "uint256" } ], "name": "getBetInfo", "outputs": [ { "internalType": "uint256", "name": "answerBlockNumber", "type": "uint256" }, { "internalType": "address", "name": "bettor", "type": "address" }, { "internalType": "bytes1", "name": "challenges", "type": "bytes1" } ], "stateMutability": "view", "type": "function", "constant": true } ];

const initialState = {
  pot : '0',
  challenges : ['A', 'B'],
  betRecords : [],
  winRecords : [],
  failRecords : [],
  drawRecords : [],
  finalRecords : [{
    index:'0',
    bettor:'0xab..',
    challenges:'ab',
    answer:'ab',
    pot:'0',
    answerBlockNumber:'5'
  }],
  web3 : null,
  Instance : null,
  account : null,
  flag : false,
}

// state 관리를 묶어서 하기위해 usestate 대신 usereducer 사용
function reducer(state, action) {
  switch (action.type){
    case "INIT":{
      let {web3, Instance, account} = action;
      return {
        ...state, web3, Instance, account
      }
    }
    case "GETPOT": { 
      let {pot} = action;
      return {
        ...state, pot
      }
    }
    case "CLICKCARD":{
      let _Character = action.data;
      let {challenges} = action;
      console.log('clickcard', _Character);
      return {
        ...state, challenges : [challenges, _Character]
      }
    }
    case "GETBETEVENT":{
      let {records} = action;
      return {
        ...state, betRecords : records
      }
    }
    case "WINEVENT":{
      let {records} = action;
      return {
        ...state, winRecords : records, flag : !state.flag
      }
    }
    case "FAILEVENT":{
      let {records} = action;
      return {
        ...state, failRecords : records, flag : !state.flag
      }
    }
    case "DRAWEVENT":{
      let {records} = action;
      return {
        ...state, drawRecords : records, flag : !state.flag
      }
    }
    case "FINALRECORD":{
      let {records} = action;
      return {
        ...state, finalRecords : records
      }
    }
  }
}


function App() {
  
  const { t, i18n } = useTranslation(); // useTranslation hook
  const [state, dispatch] = useReducer(reducer, initialState);

  // react hooks componentDidMount
  useEffect(() => {
    pollData();
  }, []);

  useEffect(() => {
    getFinalRecords();
  }, [state.flag]);

  const pollData = async () => {
    await initWeb3();
  }

  async function dataPoll(web3, Instance){
    await getPot(web3,Instance);
    await getBetEvents(Instance);
    await getWinEvents(Instance);
    await getFailEvents(Instance);
    await getDrawEvents(Instance);
  }

  const Web3 = require('web3');
  // web3 <-> metamask 연동 provider
  const initWeb3 = async () => {
    let web3, accounts, lotteryContract;

    // web3 객체 감지, 계정정보를 불러온다 (modern mode)
    if (window.ethereum) {
      web3 = new Web3(window.ethereum);
      try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } catch (error) {
        console.error('User denied account access');
        // return;
      }
    }
    // 수동으로 web3 객체 주입 (legacy mode)
    else if (window.web3) {
      web3 = new Web3(window.web3.currentProvider);
    }
    // Metamask 미설치 등 오류 (web3 instance not injected)
    else {
      console.error('No web3 provider detected, consider using Metamask');
      // return;
    }

    if (web3) {
      try {
        // 지갑 주소 가져오기
        accounts = await web3.eth.getAccounts();
        // 스마트 컨트랙트 객체 생성
        lotteryContract = new web3.eth.Contract(lotteryABI, lotteryAddress);
      } catch (error) {
        console.error('Error initializing contract', error);
        // return;
      }
    }

    dispatch({ type : 'INIT', web3, Instance : lotteryContract , account : accounts});

    let interval = setInterval(() => {
      dataPoll(web3, lotteryContract);
    }, 1000);
  };

  // 배팅함수 불러오기
  const Bet = async () => {
    // const web3 = await initWeb3();

    let {challenges, web3, Instance, account} = state;
    let challenge = '0x' + challenges[0].toLowerCase() + challenges[1].toLowerCase(); // 소문자로 통일
    let nonce = await web3.eth.getTransactionCount(account[0]);
    Instance.methods.Bet_Distribute(challenge).send({from : account[0], value : 5000000000000000, gas : 300000, nonce : nonce})
    .on('transactionHash', (hash) => {
      console.log('TransactionHash : ', hash);
    });
  }

  const getPot = async (web3, Instance) => {
    // const web3 = await initWeb3();

    let pot, potString;

    if (!web3) {
      console.error('web3 not available, cannot get pot value');
      return;
    }

    try {
      pot = await Instance.methods.getPot().call();
      // ETH 단위로 변환
      potString = web3.utils.fromWei(pot.toString(), 'ether');
    } catch (error) {
      console.error('Error getting pot value', error);
      // return;
    }

    clearInterval();
    //블록체인상 POT 로그를 불러온다
    dispatch({ type : 'GETPOT', pot : potString});
  };

  // 배팅이벤트 로그 불러오기
  const getBetEvents = async (Instance) => {
    let records = []; // const
    let events = await Instance.getPastEvents('BET', {fromBlock:0, toBlock:'latest'});  // start-end

    for (let i = 0; i < events.length; i++) {
      const record = {};
      record.index = parseInt(events[i].returnValues.index, 10).toString();
      record.bettor = events[i].returnValues.bettor.slice(0, 4) + '...' + events[i].returnValues.bettor.slice(40, 42);
      record.challenges = events[i].returnValues.challenges;
      record.answer = '0x00';
      record.win = 'Not Revealed';
      record.answerBlockNumber = events[i].returnValues.answerBlockNumber.toString();
      record.betBlockNumber = events[i].blockNumber;
      records.unshift(record);  // 배팅순서 거꾸로 표시
    }

    clearInterval();
    //블록체인상 모든 BET 이벤트 로그를 불러온다
    dispatch({type : 'GETBETEVENT', records});
  }

  // WIN 이벤트 로그 불러오기
  const getWinEvents = async (Instance) => {
    let records = []; // const
    let events = await Instance.getPastEvents('WIN', {fromBlock:0, toBlock:'latest'});  // start-end

    for(let i = 0; i < events.length; i++) {
      const record = {}
      record.index = parseInt(events[i].returnValues.index, 10).toString();
      record.amount = parseInt(events[i].returnValues.amount, 10).toString();
      record.answer = events[i].returnValues.answer;
      records.unshift(record);  // 배팅순서 거꾸로 표시
    }

    // clearInterval();
    //블록체인상 모든 WIN 이벤트 로그를 불러온다
    dispatch({type : 'WINEVENT', records});
  }

  // FAIL 이벤트 로그 불러오기
  const getFailEvents = async (Instance) => {
    let records = []; // const
    let events = await Instance.getPastEvents('FAIL', {fromBlock:0, toBlock:'latest'});  // start-end

    for(let i = 0; i < events.length; i++) {
      const record = {}
      record.index = parseInt(events[i].returnValues.index, 10).toString();
      record.amount = parseInt(events[i].returnValues.amount, 10).toString(); // 0
      record.answer = events[i].returnValues.answer;
      records.unshift(record);  // 배팅순서 거꾸로 표시
    }

    // clearInterval();
    //블록체인상 모든 FAIL 이벤트 로그를 불러온다
    dispatch({type : 'FAILEVENT', records});
  }

  // DRAW 이벤트 로그 불러오기
  const getDrawEvents = async (Instance) => {
    let records = []; // const
    let events = await Instance.getPastEvents('DRAW', {fromBlock:0, toBlock:'latest'});  // start-end

    for(let i = 0; i < events.length; i++) {
      const record = {}
      record.index = parseInt(events[i].returnValues.index, 10).toString();
      record.amount = parseInt(events[i].returnValues.amount, 10).toString(); // 0.005
      record.answer = events[i].returnValues.answer;
      records.unshift(record);  // 배팅순서 거꾸로 표시
    }
    
    // clearInterval();
    //블록체인상 모든 DRAW 이벤트 로그를 불러온다
    dispatch({type : 'DRAWEVENT', records});
  }  

  // Final 로그 불러오기
  const getFinalRecords = async () => {
    // const web3 = await initWeb3();

    let {web3} = state;
    let win = 0, fail = 0, draw = 0;
    // 기본적으로 betRecords 를 넣어주고,
    const records = [...state.betRecords];

    // WIN&FAIL&DRAW 이벤트와 매치되면 FINALRECORD 에 추가해준다
    for (let i = 0; i < state.betRecords.length; i++) {
      // WIN
      if (state.winRecords.length > 0 && state.betRecords[i].index === state.winRecords[win].index) {
        records[i].result = 'WIN';
        records[i].answer = state.winRecords[win].answer;
        records[i].pot = web3.utils.fromWei(state.winRecords[win].amount, 'ether');
        if(state.winRecords.length - 1 > win) win++;
      } 
      // FAIL
      else if(state.failRecords.length > 0 && state.betRecords[i].index === state.failRecords[fail].index) {
        records[i].result = 'FAIL';
        records[i].answer = state.failRecords[fail].answer;
        records[i].pot = web3.utils.fromWei(state.failRecords[fail].amount, 'ether');
        if(state.failRecords.length - 1 > fail) fail++;
      } 
      // DRAW
      else if(state.drawRecords.length > 0 && state.betRecords[i].index === state.drawRecords[draw].index) {
        records[i].result = 'DRAW';
        records[i].answer = state.drawRecords[draw].answer;
        records[i].pot = web3.utils.fromWei(state.drawRecords[draw].amount, 'ether');
        if(state.drawRecords.length - 1 > draw) draw++;
      }
      // Not Revealed
      else {
        records[i].answer = 'Not Revealed';
      }
    }
    
    clearInterval();
    // 블록체인상 모든 FINAL 이벤트 로그를 불러온다
    dispatch({type : 'FINALRECORD', records});
  }
  // 카드 클릭 이벤트
  const onClickCard = (Character) => {
    dispatch({type : 'CLICKCARD', data : Character, challenges : state.challenges[1]});
  }

  // 카드 정보 불러오기
  const getCard = (_Character, _Style) => {
    let _card = '';
    const characters = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
    const cards = ['🃠', '🃡', '🂲', '🃃', '🃔', '🂥', '🂶', '🃇', '🃘', '🂩', '🂱', '🃋', '🃜', '🂭', '🂾', '🃮'];

    characters.map((character, index) => {
        if (_Character === character) {
            _card = cards[index];
        }
    });

    return (
      <button className={_Style} style={{margin:"0.1%", borderRadius:10}} onClick = {() => {onClickCard(_Character)}}>
        <div className="card-header" style={{display:"flex", justifyContent:"center", alignItems:"center", width:"100%", border:"none"}}>
          <p className="card-header-text" style={{fontSize:"25px", textAlign:"center", fontWeight:550}}>{_Character}</p>
        </div>
        <div className ="card-body" style={{display:"flex", justifyContent:"center", alignItems:"center", width:"100%"}}>
          <p className="card-text-center" style={{fontSize:"1000%", textAlign:"center", margin:"auto"}}>{_card}</p>
        </div>
      </button>
    )
  }

  // collapse toggle
  const [showFirstElement, setShowFirstElement] = useState(false);
  const [showSecondElement, setShowSecondElement] = useState(false);
  const toggleFirstElement = () => setShowFirstElement(!showFirstElement);
  const toggleSecondElement = () => setShowSecondElement(!showSecondElement);
  const toggleBothElements = () => {
    setShowFirstElement(!showFirstElement);
    setShowSecondElement(!showSecondElement);
  };

  return (
    <div className="App">

      {/* Header - Pot, Betting characters */}
      <div className="container">
        <div className="jumbotron">
        <br></br>

          {/*언어 선택 버튼*/}
          {Object.keys(lngs).map((lng) => (
            <button key={lng} style={{ fontWeight: i18n.resolvedLanguage === lng ? 'bold' : 'normal', float:"right", borderWidth:1, borderRadius:10, marginRight:"0.5%", width:"8%"}} type="submit" onClick={() => i18n.changeLanguage(lng)}>
              {lngs[lng].nativeName}
            </button>
          ))}
          <br></br>
          <br></br>
          <h1 style={{fontWeight:"bold", fontSize:88}}>{t('description.title')}</h1>
          <br></br>
          <h1>{t('description.pot')} {state.pot} ETH</h1>
          <h3>{t('description.num')}</h3>
          <p style={{fontSize:50}}>{state.challenges[0]} {state.challenges[1]}</p>
        </div>
      </div>

      {/* Betting button */}
      <div className="container">
        <button className="btn btn-danger btn-lg" style={{width:120}} onClick={Bet}>{t('description.bet')}</button>
      </div>
      <br></br>

      {/* Card view */}
      <div className="container">
        <div className="card-group">
          {getCard('0', 'card bg-danger')}
          {getCard('1', 'card bg-warning')}
          {getCard('2', 'card bg-success')}
          {getCard('3', 'card bg-primary')}
          {getCard('4', 'card bg-danger')}
          {getCard('5', 'card bg-warning')}
          {getCard('6', 'card bg-success')}
          {getCard('7', 'card bg-primary')}
        </div>
        <div className="card-group">
          {getCard('8', 'card bg-danger')}
          {getCard('9', 'card bg-warning')}
          {getCard('A', 'card bg-success')}
          {getCard('B', 'card bg-primary')}
          {getCard('C', 'card bg-danger')}
          {getCard('D', 'card bg-warning')}
          {getCard('E', 'card bg-success')}
          {getCard('F', 'card bg-primary')}
        </div>
      </div>
      <br></br>
      <br></br>

      {/* History view */}
      <div className="container">
        <table className="table table-dark table-striped">
          <thead>
            <tr style={{fontSize:22, textAlign:"center"}}>
              <th>{t('description.table_1')}</th>
              <th>{t('description.table_2')}</th>
              <th>{t('description.table_3')}</th>
              <th>{t('description.table_4')}</th>
              <th>{t('description.table_5')}</th>
              <th>{t('description.table_6')}</th>
              <th>{t('description.table_7')}</th>
            </tr>
          </thead>
          <tbody>
            {
              state.finalRecords.map((record, index) => {
                return (
                  <tr key = {index}>
                    <td>{record.index}</td>
                    <td>{record.bettor}</td>
                    <td>{record.challenges}</td>
                    <td>{record.answer}</td>
                    <td>{record.pot}</td>
                    <td>{record.result}</td>
                    <td>{record.answerBlockNumber}</td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      </div>
      <br></br>

      {/* Rule&Contact view */}
      <div className="container">
      <MDBBtn style={{marginRight:5, width:120, height:44, fontSize:20}} onClick={toggleFirstElement}>{t('description.rule')}</MDBBtn>
      <MDBBtn style={{marginLeft:5, width:120, height:44, fontSize:20}} onClick={toggleSecondElement}>{t('description.contact')}</MDBBtn>
      <MDBRow>
        <MDBCol>
          <MDBCollapse show={showFirstElement} className='mt-3' style={{marginLeft:"0.1%", marginRight:"0.1%", backgroundColor:"rgba(60, 60, 60, 0.4)", borderRadius:10}}>
            <ul style={{display:"table", marginLeft:"auto", marginRight:"auto", textAlign:"left", margin:10}}>
            <br></br>
              <li>{t('description.st_1')}</li>
              <li>{t('description.st_2')}</li>
              <li>{t('description.st_3')}</li>
              <li>{t('description.st_4')}</li>
                <ul>
                  <li>{t('description.st_5')}</li>
                  <li>{t('description.st_6')}</li>
                  <li>{t('description.st_7')}</li>
                </ul>
            <br></br>
            </ul>
          </MDBCollapse>
        </MDBCol>
        <MDBCol>
          <MDBCollapse show={showSecondElement} className='mt-3' style={{marginLeft:"0.1%", marginRight:"0.1%", backgroundColor:"rgba(60, 60, 60, 0.4)", borderRadius:10}}>
          <ul style={{display:"table", marginLeft:"auto", marginRight:"auto", textAlign:"left", margin:10}}>
          <br></br>
            <li>{t('description.st_8')}</li>
            <li>{t('description.st_9')}</li>
          <br></br>
          </ul>
          </MDBCollapse>
        </MDBCol>
      </MDBRow>
      </div>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <div className="container_">
        Copyright
      </div>
      <br></br>
    </div>
  );
}

// index address challenge answer pot status answerBlockNumber
export default App;