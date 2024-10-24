import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/hello_world.tact',
    options: {
        debug: true,
    },
    
};
