const ethereumButton = document.querySelector("#mm-btn");
const sendButton = document.querySelector("#send-btn");
const charTokensInput = document.getElementById("charTokens");
const landTokensInput = document.getElementById("landsTokens");
const toAddressInput = document.getElementById("addressTo");
const accounts = null;
//Prod
const charAddr = "0x1299FdE1F8f06e1F0D6BeD0713aD259769c0F692";
const landAddr = "0xa9d460bF68A257914c6cd52cF8D4232CeA3ef8aE";
const groupSendAddr = "0x8b832354797a9f702abc47bbb867528adca6adb4";

//Test
const charsTestAddr = "0x335404944409722bf2FE5BCA0C155153ae8A38B1";
const landsTestAddr = "0x93E7A27143e28D65037C2b680dbf56Ef9F82C372";
const groupSendTestAddr = "0x8d13506Cb4da68903Eb12B4Cd915cD8146fB976B";

//sendButton.classList.toggle("hide");

let web3 = new Web3("https://rpc.testnet.fantom.network/");

const charsContract = new web3.eth.Contract(nftAbi, charsTestAddr);
const landsContract = new web3.eth.Contract(nftAbi, landsTestAddr);
const batchSendContract = new web3.eth.Contract(batchSenderAbi, groupSendTestAddr);

async function getOwnerTokenIds(account, contract) {
  const eventsReceivedTokens = await contract.getPastEvents("Transfer", {
    filter: {
      to: account,
    },
    fromBlock: 0,
  });

  // Count the number of times the account received the token
  let receivedTokensCount = {};
  for (let key in eventsReceivedTokens) {
    let tokenId = eventsReceivedTokens[key]["returnValues"]["tokenId"];
    receivedTokensCount[tokenId] = (receivedTokensCount[tokenId] || 0) + 1;
  }

  let receivedTokenIds = Object.keys(receivedTokensCount);

  // Get the tokens that the account sent
  const eventsSentTokens = await charsContract.getPastEvents("Transfer", {
    filter: {
      from: account,
      tokenId: receivedTokenIds,
    },
    fromBlock: 0,
  });

  let sentTokensCount = {};
  for (let key in eventsSentTokens) {
    let tokenId = eventsSentTokens[key]["returnValues"]["tokenId"];
    sentTokensCount[tokenId] = (sentTokensCount[tokenId] || 0) + 1;
  }

  // Substract the tokens received by the sent to get the tokens owned by account
  // Store them on ownedTokenIds
  let ownedTokenIds = [];
  for (let tokenId in receivedTokensCount) {
    if ((sentTokensCount[tokenId] ? sentTokensCount[tokenId] : 0) < receivedTokensCount[tokenId]) {
      ownedTokenIds.push(tokenId);
    }
  }
  return ownedTokenIds;
}

//0x791c958d1AA54B245D9DB7052B911027D39F207e
async function mintChars(address) {
  for (let i = 0; i < 80; i++) {
    let start = i * 50;
    const transactionParameters = {
      to: charsTestAddr,
      from: address,
      data: landsContract.methods.mintManyNftTo(address, [...links.slice(start, start + 50)]).encodeABI(),
    };

    try {
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [transactionParameters],
      });
      console.log(`https://testnet.ftmscan.com/tx/${txHash}`);
    } catch (error) {
      console.log(error.message);
    }
  }
}

const fantomChain = [
  {
    chainId: "0xfa",
    chainName: "Fantom MainNet",
    nativeCurrency: {
      name: "Fantom MainNet",
      symbol: "FTM",
      decimals: 18,
    },
    rpcUrls: ["https://rpc.ftm.tools/"],
    blockExplorerUrls: ["https://ftmscan.com/"],
  },
];

const fantomTestChain = [
  {
    chainId: "0xfa2",
    chainName: "Fantom TestNet",
    nativeCurrency: {
      name: "Fantom TestNet",
      symbol: "FTM",
      decimals: 18,
    },
    rpcUrls: ["https://rpc.testnet.fantom.network/"],
    blockExplorerUrls: ["https://testnet.ftmscan.com/"],
  },
];

const addFantomTestNetwork = async () => {
  let netVersion = await window.ethereum.request({
    method: "net_version",
  });

  if (netVersion !== 4002) {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: fantomTestChain,
    });
  }
};

const addFantomNetwork = async () => {
  let netVersion = await window.ethereum.request({
    method: "net_version",
  });

  if (netVersion !== 250) {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: fantomChain,
    });
  }
};

const connectWallet = async () => {
  if (window.ethereum) {
    try {
      await addFantomTestNetwork();
      const addressArray = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (addressArray.length > 0) {
        return {
          address: addressArray[0],
          status: "OK",
        };
      } else {
        return {
          address: "",
          status: "🦊 Connect to Metamask using the top right button.",
        };
      }
    } catch (err) {
      return {
        address: "",
        status: "😥 " + err.message,
      };
    }
  } else {
    return {
      address: "",
      status: "NO MM",
    };
  }
};

if (typeof window.ethereum !== "undefined") {
  ethereumButton.addEventListener("click", async () => {
    const { address, status } = await connectWallet();
    if (status === "OK") ethereumButton.innerText = `Connected ${address}`;
    let charIds = await getOwnerTokenIds(address, charsContract);
    let landsIds = await getOwnerTokenIds(address, landsContract);

    charTokensInput.value = charIds;
    landTokensInput.value = landsIds;

    sendButton.classList.toggle("hide");
    sendButton.addEventListener("click", async () => {
      const transactionParamChar = {
        to: charsTestAddr,
        from: address,
        data: charsContract.methods.setApprovalForAll(groupSendTestAddr, true).encodeABI(),
      };

      const transactionParamLand = {
        to: landsTestAddr,
        from: address,
        data: landsContract.methods.setApprovalForAll(groupSendTestAddr, true).encodeABI(),
      };

      const txHashCharsApprove = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [transactionParamChar],
      });

      console.log(`Chars approve https://testnet.ftmscan.com/tx/${txHashCharsApprove}`);

      const txHashLandsApprove = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [transactionParamLand],
      });

      console.log(`Lands approve https://testnet.ftmscan.com/tx/${txHashLandsApprove}`);
      const transactionParameters = {
        to: groupSendTestAddr,
        from: address,
        data: batchSendContract.methods.sendBatchAll(charIds, landsIds, toAddressInput.value.toLowerCase()).encodeABI(),
      };

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [transactionParameters],
      });
      console.log(`Send batch https://testnet.ftmscan.com/tx/${txHash}`);
    });
    console.log(address);
  });
}
