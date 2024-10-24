import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/ForwardFee.tact',
    options: {
        debug: true,
    },
    
};