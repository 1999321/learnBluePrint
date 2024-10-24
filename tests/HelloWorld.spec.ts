import { Blockchain, SandboxContract, TreasuryContract, printTransactionFees } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { HelloWorld } from '../wrappers/HelloWorld';
import { HelloWorldTwo } from '../wrappers/HelloWorldTwo';
import '@ton/test-utils';
import { AccountStateActive } from '@ton/core/dist/types/AccountState';
import { formatCoinsPure } from '@ton/sandbox/dist/utils/printTransactionFees';
import { BlockchainTransaction } from '@ton/sandbox';

describe('HelloWorld', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let helloWorld: SandboxContract<HelloWorld>;
    let helloWorldTwo: SandboxContract<HelloWorldTwo>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        //console.log("blockchain:", blockchain.config);

        helloWorld = blockchain.openContract(await HelloWorld.fromInit(0n));//fromInit里面输出了其传播的初始化数据长度为605
        helloWorldTwo = blockchain.openContract(await HelloWorldTwo.fromInit(0n));//fromInit里面输出了其传播的初始化数据长度为605

        deployer = await blockchain.treasury('deployer');
        let beforeBalance = await deployer.getBalance();
        console.log("deployer balance before:", beforeBalance)

        const deployResult = await helloWorld.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',//Deployable的参数
                queryId: 0n,//用于确定部署的哪个合约被节点成功返回
            }
        );
        let afterBalance = await deployer.getBalance()
        console.log("deployer balance after:", afterBalance)
        console.log("use:", beforeBalance - afterBalance)
        printTransactionFees(deployResult.transactions);
        console.log("transactions:", deployResult.transactions[0].events, deployResult.transactions[1].events, deployResult.transactions[2].events)

        const deployTwoResult = await helloWorldTwo.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',//Deployable的参数
                queryId: 0n,//用于确定部
            }
        )
        
        let afterBalanceTwo = await deployer.getBalance()
        console.log("deployer balance after two:", afterBalanceTwo)
        console.log("use two:", afterBalance - afterBalanceTwo)
        printTransactionFees(deployTwoResult.transactions);
        console.log("transactions:", deployTwoResult.transactions[0].events, deployTwoResult.transactions[1].events, deployTwoResult.transactions[2].events)
        let totalFees = deployTwoResult.transactions[0].totalFees.coins + deployTwoResult.transactions[1].totalFees.coins + deployTwoResult.transactions[2].totalFees.coins;
        let forwardFees = deployTwoResult.transactions[0].description.type == 'generic'?deployTwoResult.transactions[0].description.actionPhase?.totalFwdFees ?? BigInt(0): BigInt(0)
        //forwardFees += deployTwoResult.transactions[1].description.type == 'generic'?deployTwoResult.transactions[1].description.actionPhase?.totalFwdFees ?? BigInt(0): BigInt(0)
        //forwardFees += deployTwoResult.transactions[2].description.type == 'generic'?deployTwoResult.transactions[2].description.actionPhase?.totalFwdFees ?? BigInt(0): BigInt(0)
        console.log("totalFees:", totalFees, "cha", afterBalance - afterBalanceTwo - totalFees)
        console.log("forwardFees:", forwardFees)
        console.log("inMessage mode:", deployTwoResult.transactions[0].inMessage?.info.type, deployTwoResult.transactions[1].inMessage?.info.type, deployTwoResult.transactions[2].inMessage?.info.type)
        // printTransactionFees(deployResult.transactions);
        // console.log("deployerAddress:", deployer.address, "helloWorldAddress:", helloWorld.address)
        // console.log("transactions:", deployResult.transactions[0].events, deployResult.transactions[1].events, deployResult.transactions[2].events)

        // let helloworldstate:AccountStateActive = (await blockchain.getContract(helloWorld.address)).accountState as AccountStateActive;
        // let helloworldtwostate:AccountStateActive = (await blockchain.getContract(helloWorldTwo.address)).accountState as AccountStateActive;
        // let helloworlddatalength = helloworldstate.state.data?.toBoc().length;//581，//这里581和605的差值是24，具体原因未知，按道理应该是257-32=225，225/8=28，这里少去除的4个字节目前不知道所为何意。
        // let helloworldtwodatalength = helloworldtwostate.state.data?.toBoc().length;//585
        // expect(helloworlddatalength).toEqual(helloworldtwodatalength?helloworldtwodatalength - 4:0);//表明实际上的数据占位因为定义不一样（uint32 vs uint64)，所以相差4个字节。
        

        // expect(deployResult.transactions).toHaveTransaction({
        //     from: deployer.address,
        //     to: helloWorld.address,
        //     deploy: true,
        //     success: true,
        // });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and helloWorld are ready to use
    });

    // it('should increase counter', async () => {
    //     const increaseTimes = 3;
    //     for (let i = 0; i < increaseTimes; i++) {
    //         console.log(`increase ${i + 1}/${increaseTimes}`);

    //         const increaser = await blockchain.treasury('increaser' + i);

    //         const counterBefore = await helloWorld.getCounter();

    //         console.log('counter before increasing', counterBefore);

    //         const increaseBy = BigInt(Math.floor(Math.random() * 100));

    //         console.log('increasing by', increaseBy);

    //         const increaseResult = await helloWorld.send(
    //             increaser.getSender(),
    //             {
    //                 value: toNano('0.05'),
    //             },
    //             {
    //                 $$type: 'Add',
    //                 queryId: 0n,
    //                 amount: increaseBy,
    //             }
    //         );

    //         expect(increaseResult.transactions).toHaveTransaction({
    //             from: increaser.address,
    //             to: helloWorld.address,
    //             success: true,
    //         });

    //         const counterAfter = await helloWorld.getCounter();

    //         console.log('counter after increasing', counterAfter);

    //         expect(counterAfter).toBe(counterBefore + increaseBy);
    //     }
    // });
});
