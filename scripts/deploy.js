const lotteryAbi = require("../abi/PancakeSwapLottery.json");
const config = require("../config");
const { parseUnits } = require("@ethersproject/units");
const { ethers } = require("hardhat");

const networkName = process.env.NETWORK_NAME;
console.log("wertyui", networkName);
async function startLottery() {
  console.log("start lottery");
  let timestamp = Math.floor(new Date().getTime() / 1000);
  const [operator] = await ethers.getSigners();

  const contract = await ethers.getContractAt(
    lotteryAbi,
    config.Lottery[networkName]
  );

  const [_blockNumber, _gasPrice] = await Promise.all([
    ethers.provider.getBlockNumber(),
    ethers.provider.getGasPrice(),
  ]);
  console.log("start 20", _blockNumber);

  console.log("urteu", timestamp);
  console.log("actual hour", process.env.LOTTERY_END_TIME_IN_SEC);
  console.log("end time", timestamp + Number(process.env.LOTTERY_END_TIME_IN_SEC));

  let startLottery = await contract.startLottery(
    timestamp + Number(process.env.LOTTERY_END_TIME_IN_SEC),
    parseUnits("1", "ether"),
    config.Discount[networkName],
    config.Rewards[networkName],
    config.Treasury[networkName],
    { from: operator.address, gasLimit: 5000000 }
  );
  console.log("start 30", startLottery);

  let waitFortx = await startLottery.wait();
  console.log("33wwwwwww", waitFortx);
  if (waitFortx) {
    setTimeout(() => {
      closeLottery().catch((error) => {
        console.error(error);
        process.exitCode = 1;
      });
    }, 1000 * process.env.CLOSE_LOTTERY_TIME_IN_SEC);
  }
}

async function closeLottery() {
  console.log("close lottery");

  const [operator] = await ethers.getSigners();
  const contract = await ethers.getContractAt(
    lotteryAbi,
    config.Lottery[networkName]
  );
  const [_lotteryId, _randomGenerator] = await Promise.all([
    contract.currentLotteryId(),
    contract.randomGenerator(),
  ]);
  const tx = await contract.closeLottery(_lotteryId, {
    from: operator.address,
    gasLimit: 500000,
  });
  let waitfortx = await tx.wait();
  if (waitfortx) {
    setTimeout(() => {
      drawLottery().catch((error) => {
        console.error(error);
        process.exitCode = 1;
      });
    }, 1000 * process.env.DRAW_LOTTERY_TIME_IN_SEC);
  }
}

async function drawLottery() {
  console.log("draw lottery");

  const [operator] = await ethers.getSigners();

  const contract = await ethers.getContractAt(
    lotteryAbi,
    config.Lottery[networkName]
  );
  const [_lotteryId] = await Promise.all([contract.currentLotteryId()]);

  const tx = await contract.drawFinalNumberAndMakeLotteryClaimable(
    _lotteryId,
    true,
    {
      from: operator.address,
      gasLimit: 500000,
    }
  );

  let waitfortx = await tx.wait();
  if (waitfortx) {
    setTimeout(() => {
      startLottery().catch((error) => {
        console.error(error);
        process.exitCode = 1;
      });
    }, 1000 * process.env.START_LOTTERY_TIME_IN_SEC);
  }
}

startLottery().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
