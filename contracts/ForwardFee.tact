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