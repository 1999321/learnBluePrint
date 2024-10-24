import { Cell, toNano } from '@ton/core';
import { HelloWorld } from '../wrappers/HelloWorld';
import { NetworkProvider } from '@ton/blueprint';
import { Address } from '@ton/core';
import HelloWorldCode from '../wrappers/Actor';
import { ContractState } from '@ton/core';

export async function run(provider: NetworkProvider) {
    // const defaultAddress: any = 'EQA2syJvY19L-5rv1YtBSl-rpojqsk-_p385RabVFr87O0G5'

    // console.log(provider.network());
    // console.log(provider.api())
    // console.log(provider.ui())
    // console.log(provider.sender())
    // console.log(await provider.provider(provider.sender().address??defaultAddress).getState())

    // const defaultContractAddress: any = 'EQCMlVAcc0dAqRik2ezyYkCPplh2LRtSak2QzOUdwA8k7y02'
    // console.log(await provider.provider(defaultContractAddress).getState())
    // let helloworld = await provider.provider(defaultContractAddress).getState()
    // console.log(helloworld.last?.hash.toString('base64'))

    const oldHelloWorld: any = 'kQBfSKFzlF6iMAr1XuXt3Evmv5nw8WgatCoL2A4-g8KigN5a'
    //console.log(await provider.provider(oldHelloWorld).getState())
    let oldhelloworld: any = await provider.provider(oldHelloWorld).getState()
    // console.log(oldhelloworld.last?.hash.toString('base64'))
    let data = oldhelloworld.state?.data.toString('base64')
    let cell = Cell.fromBase64(data)
    console.log("data length:", oldhelloworld.state?.data.length)//580长度
    // let code = oldhelloworld.state?.code.toString('hex')
    // let code_default = HelloWorldCode.hex
    // console.log(data)
    // console.log(code)
    // console.log(Buffer.from(code, 'hex').toString('base64'))

    const helloworldInstance = await HelloWorld.fromInit(BigInt(Math.floor(Math.random() * 10000)))//605长度，差25，估计是257-32=225，225/8=28
    //helloworldInstance
    
    // const helloWorld = provider.open(await HelloWorld.fromInit(BigInt(Math.floor(Math.random() * 10000))));

    // await helloWorld.send(
    //     provider.sender(),
    //     {
    //         value: toNano('0.05'),
    //     },
    //     {
    //         $$type: 'Deploy',
    //         queryId: 0n,
    //     }
    // );

    // await provider.waitForDeploy(helloWorld.address);

    // console.log('ID', await helloWorld.getId());
}
