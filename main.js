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

async function setApprovalForAll(contract, owner) {
  const txParams = {
    to: contract._address,
    from: owner,
    data: contract.methods.setApprovalForAll(groupSendTestAddr, true).encodeABI(),
  };

  try {
    let approveStatus = await contract.methods.isApprovedForAll(owner, groupSendTestAddr).call();
    if (approveStatus) return "already approved!";
    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [txParams],
    });
    return `${fantomTestChain.blockExplorerUrls}/tx/${txHash}`;
  } catch (error) {
    return error.message;
  }
}

async function sendBatchAll(contract, address, charIds, landsIds, toAddress) {
  const txParams = {
    to: contract._address,
    from: address,
    data: contract.methods.sendBatchAll(charIds, landsIds, toAddress).encodeABI(),
  };

  try {
    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [txParams],
    });
    return `${fantomTestChain.blockExplorerUrls}/tx/${txHash}`;
  } catch (err) {
    return err.message;
  }
}

if (typeof window.ethereum !== "undefined") {
  ethereumButton.addEventListener("click", async () => {
    const { address, status } = await connectWallet();
    if (status === "OK") ethereumButton.innerText = `Connected ${address}`;
    let charIds = await getOwnerTokenIds(address, charsContract);
    let landsIds = await getOwnerTokenIds(address, landsContract);

    if (charIds.length > 50) charIds = [...charIds.splice(0, 50)];

    charTokensInput.value = charIds;
    landTokensInput.value = landsIds;
    sendButton.classList.toggle("hide");
    sendButton.addEventListener("click", async () => {
      const txHashCharsApprove = await setApprovalForAll(charsContract, address);
      console.log(`Chars approve ${txHashCharsApprove}`);

      const txHashLandsApprove = await setApprovalForAll(landsContract, address);
      console.log(`Lands approve ${txHashLandsApprove}`);

      const txHashBatch = await sendBatchAll(
        batchSendContract,
        address,
        charIds,
        landsIds,
        toAddressInput.value.toLowerCase()
      );
      console.log(`Send batch ${txHashBatch}`);
    });
  });
}
