# Blueprint

```shell
npm create ton@latest
```

该命令会创建一个文件夹，包含内容：

1. build:合约代码编译之后的文件夹，里面有一个`tact_<contract_name>.ts`的文件，是部署和调用该合约的关键代码。
2. contracts:存放合约代码的文件夹，可包括`func`、`tact`代码。
3. scripts: 脚本
4. tests: 测试代码，其测试利用`@ton/sandbox`来创建一个虚拟的`blockchain`来替代`provider`，从而实现区块链的环境模拟和测试。
5. wrappers: 里面包含编译的配置文件，如`<Contract_name>.compile.ts`
6. `.env`包含了钱包的种子（24个助记词）和钱包版本（指`ton`钱包版本，有多种版本，包括`v4`等。具体可以写一个错误的版本，然后引发错误，看他有多少个版本）（作者加上去的文件）
7. `blueprint.config.ts`可以填写运行的网络。（作者加上去的文件）

```shell
npx blueprint build
```

编译并且建立`build`文件夹。

```shell
npx blueprint run
```

以交互的方式来选择运行的脚本。这里可以考察到其脚本都是一个函数：

```typescript
export async function run(provider: NetworkProvider, ...args:any[]) {...}
```

形如上面的，如果想要以交互的方式来获得输入，那么可以使用:

```typescript
await provider.ui().input(`提示内容`)
```

还可以获得一些其他的状态：

```typescript
console.log(provider.network());//network type
console.log(provider.api())//client type
console.log(provider.ui())//内部输入
console.log(provider.sender())//包含的账户地址多个
console.log(await provider.provider(provider.sender().address??defaultAddress).getState())// 获取账户的状态，每个账户都是一份合约来的。
//账户的状态包括：balance\last{lt,hash}\state{type,code,data}
```

了解Ton的Cell：

1. 1023 bits 
2. Cell [] (最多四个)

Cell通过Bag of Cell的方式进行序列化，其序列化的目的是为了数据可传输，同时序列化保持Cell的1023 bits + Cell []的结构，使其可以被结构成 Cell。（`BigBuilder` => `Builder` => `Cell`）

Cell的输出或者处理单元是以8位为处理单元，但是是属于非常紧密拼接的形式进行存储的，也就是说即使是在一个8位里面，也可能包含两个或者两个以上的数据，那么怎么对此进行读取/区分，这部分估计是写进了合约里面，也即其数据位置是写进合约编译后的代码里面的，以固定或者函数的方式获取数据位置，这里的函数方式主要是指数组和映射这一类型的。

同时Cell还提供了关于默克尔树的特殊Cell，[看这里](https://docs.ton.org/mandarin/develop/data-formats/exotic-cells)，其主要的目的可以看其简单证明的例子，该例子证明存在某Cell a存在Cell c当中，其中Cell c的哈希值是知道的（计算Cell的哈希可以[看这里](https://docs.ton.org/mandarin/develop/data-formats/cell-boc)，计算Cell的哈希实则是把子Cell替换成hash的形式，逐层替换并计算哈希，自下往上），Cell a的的具体值知道，这里主要就是通过三者特殊Cell的形式来完成这一步证明。

还有一类特殊Cell是`Library Cell`，该类Cell主要是为了库引用的，类似于以太坊的预编译合约。

了解`lt`

这是逻辑时间，用来表面信息之间的新鲜度，同时也来表示账户的最近活跃点

对于`wrappers`的了解：

1. 每个合约写一个compile文件：`合约名字.compile.ts`

合约（`Tact`）当中的`uint32`：~~依然占据257位的，可以通过生成的`build`文件的`fromInit`函数内容看出来。~~占据32位，只是函数参数表明类型为`Int`，所以函数参数需要传输257位。

`value`理解

有三类`value`：

1. `message value`，指的是信息携带的`value`，由`message`进行明确指定的。
2. `contract balance`，指的是合约的余额。

关于mode `SendPayGasSeparately`,这个是使得`in_forward_fee`（下一个信息）不从`message value`当中进行扣除，而是从当前的`contract balance`当中进行扣除（在`TON`当中，账户也是合约来的）。

`fee`理解

下面看清楚是属于

> transaction_fee = storage_fees
>                 \+ in_fwd_fees
>                 \+ computation_fees 
>                 \+ action_fees 
>                 \+ out_fwd_fees

`storage_fees`是表示存储（代码+数据）的手续费，其有公式：

> storage_fee = (cells_count * cell_price + bits_count * bit_price)
>   / 2^16 * time_delta

`cells_count`:智能合约使用的cell的数量

`bits_amount`: 智能合约使用的位数

`cell_price`: 单个cell的价格

`bit_price`：单个位的价格

这里的cell的数量并非根cell的数量，同时也包含被引用的cell的数量。

bit的数量也即代码+数据的字节数组的长度`x8`.

`storage_fees`的计算需要两笔交易，这两笔交易的时间间隔知道。`storage_fees`是在发起信息调用的时候进行扣除的。

一般来说，在`@ton/sandbox`当中，以`outForwardFee`来记录`action_fees + in_forward_fee（next）`,因为真正的`out_forward_fee`的内容并没有进行启用。

关于`SendPayGasSeparately`和`CARRY_ALL_REMAINING_INCOMING_VALUE`两种模式，第一个是下一次信息的输入的`value`是写好的数量（或者说当次的输出的`value`是写好的数量），

![](D:\myfile\PAYGASSEPARATELY.PNG)

这里观察到该模式下，所有的手续费由`contract balance`进行支付，而非`message value`，包括`action_fees + in_forward_fee（next）+ computation_fee`，不仅仅是`in_forward_fee（next）`,第二种模式的话，是把上面的手续费先进行扣除，然后得到最终输出的`message value`。

![](D:\myfile\捕获.PNG)

然后在`default`(0)模型当中，`message value`负责`action_fees + in_forward_fee（next）`，不负责`computation_fee`。

![](D:\myfile\NONE.PNG)

合约部署

合约部署的费用不计入以上的手续费当中，直接在`contract balance`当中进行扣除。

在`@ton/sandbox`当中，最终消耗的手续费总额是`totalFees`和`inForwardFee`两列元素的和。

![](D:\myfile\捕获.PNG)

即：`0.004905+0.003157+0.000124+0.001917882+0.000318936`，`totalFees`一般情况下是包括`totalActionFees + computeFee`的，第一条信息是因为部署了合约，所以其总费用包含了部署合约的费用，也即`0.004905 - 0.000775 - 0.000959`。

上面的`action_fees`和表中的`totalActionFees`是一样的意义。同理`computeFee`和`computation_fee`。

手续费的计算基于`TransactionDescription`来进行的。（`loc:@ton/core/dist/types/TransactionDescription.d.ts`）

（`loc:@ton/core/dist/types/Transactions.d.ts`）

Ton测试包`@ton/sandbox^0.22.0`的测试原理：

1. 首先创建一个虚拟的`BlockChain`：(`loc:@ton/sandbox/dist/blockchain/Blockchain.js`)
   
   ```typescript
   blockchain = await Blockchain.create();
   ```
   
   该`BlockChain`包含：
   
   1. `executor`，这个包含了一个模拟的执行环境。该执行环境是基于`Emscripten`将基于`LLVM`的语言编译成`WebAssembly`，然后进行模拟运行。(`loc:@ton/sandbox/dist/executor/Executor.js`)
   
   2. `storage`，这个是存储合约的代码和数据的地方，其采用`Map`的方式，从`address`映射到`SmartContract`，该`SmartContract`的基本架构包含两个元素：`address`和`Blockchain`。(`loc:@ton/sandbox/dist/blockchain/SmartContract.js`)
   
   3. `config`，这个是区块链的一些状态信息：
      
      ```typescript
          this.currentLt = 0n;
          this.messageQueue = [];
          this.logsVerbosity = {
              print: true,
              blockchainLogs: false,
              vmLogs: 'none',
              debugLogs: true,
          };
          this.lock = new AsyncLock_1.AsyncLock();
          this.contractFetches = new Map();
          this.nextCreateWalletIndex = 0;
          this.shouldRecordStorage = false;
          this.networkConfig = blockchainConfigToBase64(opts.config);
      ```
      
      这个`networkConfig`是一坨cell，没有相对应的文档很难去进行解析。

2. 然后创建一个`SandBoxContract<Contract>`。这个和`@ton/core/dist/contract/openContract.js`(`@ton/core^0.58.1`)的`openContract`处理方式是一致的，都是基于一个结构体的代理模式`proxy`来进行，这个`<>`里面的结构体即为所代理的对象。不过这个测试需要返回更多的信息，包括一些列的运行时和运行后的区块链的信息，并且传参也是不一样的，所以其在每次的调用结束之后，都会进行一次区块链的信息返回：
   
   ```typescript
   return {
       ...await blkch.runQueue(),
       result: r,
   };
   ```
   
   这里可以看到，其会运行区块链的队列的交易信息，因为调用的最终结果是`pushMessage`，并且返回队列的运行结果，包含其运行时的环境信息和运行后的结果。

3. 接下来进行运行的全流程：
   
   1. `SandBoxContract<ContractName>`的`proxy`运行，位于`openContract`的返回值形式当中
   
   2. `<ContractName>`的对应的函数`get`、`send`
   
   3. 如果是`send`的过程（下面都是基于这个的），那么运行`<ContractName>`的`send`
   
   4. `<BlockchainProvider>.internal`，这个`<BlockchainProvider>`（上面的`SandBoxContract<ContractName>`都是该类型）是在`openContract`的时候，基于合约的代码和数据以及地址进行创建的。这个`provider`并没有连上什么账户。可以通过比较，如果非测试环境，是需要一堆账户组成的`NetworkProvider`，然后基于`NetworkProvider.open`来获取合约对象。
   
   5. `<Treasury>.send`，这里的`Treasury`是位于`.../treasury/Treasury.js`当中，是通过`depolyer`这个`SandboxContract<TreasuryContract>`对象的`getSender()`函数进行返回的。
      
      ```typescript
      deployer = await blockchain.treasury('deployer');
      ```

6. `<BlockchainProvider>.external`，这里的`<BlockchainProvider>`是指`deployer`

7. `<Blockchain>.pushMessage`

8. 最后是`<Blockchain>.runQueue`

对`slice`和`cell`对数据存取的设计：

```typescript
export type Add = {
    $$type: 'Add';
    queryId: bigint;
    amount: bigint;
}
export function storeAdd(src: Add) {
    return (builder: Builder) => {
        let b_0 = builder;
        b_0.storeUint(2335447074, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeUint(src.amount, 32);
    };
}

export function loadAdd(slice: Slice) {
    let sc_0 = slice;
    if (sc_0.loadUint(32) !== 2335447074) { throw Error('Invalid prefix'); }
    let _queryId = sc_0.loadUintBig(64);
    let _amount = sc_0.loadUintBig(32);
    return { $$type: 'Add' as const, queryId: _queryId, amount: _amount };
}
```

这段代码是对结构体：

```tact
message Add {
    queryId: Int as uint64;
    amount: Int as uint32;
}
```

的生成。

可以看到，`storeAdd`或者`loadAdd`，都是对位的操作，把每一个结构体的参数的位置进行硬编码，以此来解析`slice`(cell的片段)或者解析`cell`。

`ctx.readForwardFee()`

这个是表示当前消息当中记录的关于下一次信息的`outForwardFees`。合约账户的事件似乎是预告下一条信息。

该测试合约代码为：

```typescript
import "@stdlib/deploy";

message Add {
    queryId: Int as uint64;
    amount: Int as uint32;
}

contract ForwardFee with Deployable {
    id: Int as uint64;
    counter: Int as uint32;

    init(id: Int) {
        self.id = id;
        self.counter = 0;
    }

    receive(msg: Add) {
        self.counter += msg.amount;
        let ctx:Context = context();
        dump(ctx.readForwardFee());
        dump(ctx.value);
        //dump(sender());
        dump(myBalance());
        // Notify the caller that the receiver was executed and forward remaining value back
        self.notify("Cashback".asComment());
    }
}
```

其测试代码：

```typescript
import { Blockchain, SandboxContract, TreasuryContract, printTransactionFees } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { ForwardFee } from '../wrappers/ForwardFee';
import '@ton/test-utils';

describe('ForwardFee', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let forwardFee: SandboxContract<ForwardFee>;

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
```

以下是关于`send``add`的输出：

1. 合约内的输出:
   
   ![](D:\myfile\dump.PNG)

2. 手续费输出：
   
   ![](D:\myfile\dump_fee.PNG)

3. 事件输出：
   
   ![](D:\myfile\dump_events.PNG)
   
   这里可以看到，从合约内输出可以看到，当前所处的环境是合约`ForwardFee`当中，因为看它的余额即可知道，所以这里的`ctx.readForwardFee`是关于上一次信息的`outForwardFee`的输出。也因此可以知道，这些事件是预告下一次消息的内容的。同时从第一个信息的输入金额为0可以知道，其直接从账户合约出发的，不存在需要把信息转发到账户合约这种说法，任何交易的出发点即为账户合约。

关于时间的控制方面：

可以通过`jest`的计时器模拟进行实现:

```typescript
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
```

也可以通过`await sleep(...)`进行控制。

所以，`jest`的计时器模拟可以直接把关于时间的包的调用进行了控制（具体的原理未知，可能是自己维持一个关于时间的堆栈），并且该测试的区块链的时间是基于系统的时间的包来获取时间。
