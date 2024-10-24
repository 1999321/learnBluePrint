import { Blockchain, SandboxContract, TreasuryContract, printTransactionFees } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { ForwardFee } from '../wrappers/ForwardFee';
import '@ton/test-utils';

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


describe('ForwardFee', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let forwardFee: SandboxContract<ForwardFee>;
    jest.useFakeTimers();

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        //console.log("blockchain:", blockchain.config);

        forwardFee = blockchain.openContract(await ForwardFee.fromInit(0n));//fromInit里面输出了其传播的初始化数据长度为605

        deployer = await blockchain.treasury('deployer');

        const deployResult = await forwardFee.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',//Deployable的参数
                queryId: 0n,//用于确定部
            }
        );

        //console.log(blockchain.now)

        // await sleep(1000); //控制时间有效

        //console.log(blockchain.now)

        jest.advanceTimersByTime(1000);//控制时间有效

        printTransactionFees(deployResult.transactions);

        const forward_test =  await forwardFee.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Add',
                queryId: 0n,
                amount: 1n,
            }
        );

        printTransactionFees(forward_test.transactions);
        console.log(forward_test.transactions[0].events, forward_test.transactions[1].events, forward_test.transactions[2].events)
    })
    it('ForwardFee', async () => {})
})