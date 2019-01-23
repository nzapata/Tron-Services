var express = require('express');
var config = require('../config/config')
var router = express.Router();
const TronWeb = require('tronweb');
const HttpProvider = TronWeb.providers.HttpProvider;
const fullNode = config.fullNode;
const solidityNode = config.solidityNode;
const eventServer = config.eventServer;
const privateKey = config.privateKey; //Private key need to be on hex before transaction
const publicKey =  config.publicKey;
const tronWeb = new TronWeb(fullNode, solidityNode, eventServer,privateKey);



/*
 * Create Tron Account
 */

exports.createAccount = async (req, res) => {
    try {
        let account = await tronWeb.createAccount(); //Create Account
        let isValid = tronWeb.isAddress(account.address.hex); //Validate account

        if (isValid) {
            return res.status(200).json({account,a});
        }
    } catch (error) {
        console.error(error);
        return res.status(400).json({
            message: 'Failed to create Deposit Account',
            error: error
        });
    }
};



exports.createToken = async (req, res) => {
    const {tokenName, abbreviation, companyDescription, url,totalSupply,trxRatio,tokenRatio,
        saleStart,saleEnd, freeBandwidth,freeBandwidthLimit,frozenAmount,frozenDuration,company_Pk,company_Pvk} = req.body;
    //Calculating bandwidth
    let getBandwidth = await tronWeb.trx.getBandwidth(company_Pk);
    const tokenOptions = {
        name: tokenName, abbreviation: abbreviation, description: companyDescription,url:url,
        totalSupply: totalSupply,
        trxRatio: trxRatio, // How much TRX will tokenRatio cost?
        tokenRatio: tokenRatio, // How many tokens will trxRatio afford?
        saleStart: Date.now() + 1 ,
        saleEnd: Date.now() + 3 ,
        freeBandwidth: freeBandwidth, // The creator's "donated" bandwidth for use by token holders
        freeBandwidthLimit: freeBandwidthLimit, // Out of totalFreeBandwidth, the amount each token holder get
        frozenAmount: frozenAmount,
        frozenDuration: frozenDuration
    };
    try {

        let TokenInfo = await tronWeb.transactionBuilder.createToken(options = tokenOptions, issuerAddress = publicKey);

        //singing the transaction
        let signedtxn = await tronWeb.trx.sign(TokenInfo, privateKey);
        // Broadcasting the transaction
        let receipt = await tronWeb.trx.sendRawTransaction(signedtxn);

        return res.status(200).json({receipt,"Bandwidth":getBandwidth,"txID":signedtxn.txID});

    } catch (error) {
        console.error(error);
        return res.status(400).json({
            message: 'Failed to create token',
            error: error
        });
    }
};

/*
 * Send Trx transaction to Tron
 * @parameter { String } to who we sending the Tron public key
 * @parameter { String } amount who we sending the Amount
 * @parameter { String } from of the sender hex that this account belong to
 * @parameter { String } Private key needs to match seller public_key
 *  https://developers.tron.network/docs/bandwith#section-normal-transaction need to calculate
 *  https://developers.tron.network/docs/tronweb-transaction-builder#section-send-trx
 *
 */
exports.sendTrx = async (req, res) => {
    const {to, amount, from, private_key} = req.body;

    let errorMessage = null;

    if (!(to && to !== '')) {
        errorMessage = 'Please enter Address';
    }

    if (!(amount && amount > 0)) {
        errorMessage = 'Please enter amount';
    }

    if (!(from && from !== '')) {
        errorMessage = 'Please enter Public key of the sender';
    }

    if (!(private_key && private_key !== '')) {
        errorMessage = 'Please enter Public key of the sender';
    }

    if (errorMessage) {
        return res.status(400).send(errorMessage);
    }

    if (!errorMessage) {
        try {
            //Creating Object
            const txObject = {
                to: to,
                amount: await tronWeb.toSun(amount),
                from: await tronWeb.address.toHex(from)
            };
            //Getting Transaction Information to sign transaction
            let TxInfo = await tronWeb.transactionBuilder.sendTrx(txObject.to,txObject.amount,txObject.from);

            //singing the transaction
            let signedtxn = await tronWeb.trx.sign(TxInfo, private_key);

            // Broadcasting the transaction
            let receipt = await tronWeb.trx.sendRawTransaction(signedtxn);

            //Calculating bandwidth
            let getBandwidth = await tronWeb.trx.getBandwidth(from);

            return res.status(200).json({receipt,"Bandwidth":getBandwidth,"txID":signedtxn.txID});

        } catch (error) {
            return res.status(400).json({
                message: 'Unable to send Trx amount',
                error: error
            });
        }
    }
}


/*
 * @parameter { String } to who we sending the Tron public key
 * @parameter { String } amount who we sending the Amount
 * @parameter { String } from of the sender hex that this account belong to
 * @parameter { String } Token Name of the token Need to match exact capitalization
 * @parameter { String } Private key needs to match seller public_key
 *  https://developers.tron.network/docs/bandwith#section-normal-transaction need to calculate
 *  https://developers.tron.network/docs/tronweb-transaction-builder#section-send-token
 */

exports.sendToken = async (req, res) => {

    const {to, amount, token, from, private_key} = req.body;

    let errorMessage = null;

    if (!(to && to !== '')) {
        errorMessage = 'Please enter Reciever';
    }

    if (!(amount && amount > 0)) {
        errorMessage = 'Please enter amount';
    }

    if (!(token && token !== '')) {
        errorMessage = 'Please enter validate token';
    }

    if (!(from && from !== '')) {
        errorMessage = 'Please enter Public key of the sender';
    }

    if (!(private_key && private_key !== '')) {
        errorMessage = 'Please enter private key of the sender';
    }

    if (errorMessage) {
        return res.status(400).send(errorMessage);
    }

    if (!errorMessage) {


        try {
            //Creating Object
            const txObject = {
                to: await to,
                amount: amount,
                from: await tronWeb.address.toHex(from),
                token:token.trim(),
                private: private_key
            };
            console.log(txObject);

            let TokenInfo = await tronWeb.transactionBuilder.sendToken(txObject.to, txObject.amount, txObject.token, txObject.from);
            //singing the transaction
            let signedtxn = await tronWeb.trx.sign(TokenInfo, txObject.private);
            // Broadcasting the transaction
            let receipt = await tronWeb.trx.sendRawTransaction(signedtxn);

            //Calculating bandwidth
            let getBandwidth = await tronWeb.trx.getBandwidth(from);

            return res.status(200).json({receipt,"Bandwidth":getBandwidth,"txID":signedtxn.txID});

        } catch (error) {

            return res.status(400).json({
                message: 'Failed to send token',
                error: error
            });
        }
    }
};

/*
 * Freeze tron to gain energy or bandwidth
 * @parameter { String } To who we sending the Tron public key
 * @parameter { String } Amount who we sending the Amount
 * @parameter { String } The amount of durantion that you want trx to be frozen
 * @parameter { String } What type of resource or energy
 * https://developers.tron.network/docs/tronweb-transaction-builder#section-freeze-balance
 *
 */
exports.freezeTrx = async (req, res) => {
    const {public_key, amount, duration, resource} = req.body;

    let errorMessage = null;

    if (!(public_key && public_key !== '')) {
        errorMessage = 'Please enter Public Key of Account';
    }

    if (!(amount && amount > 0)) {
        errorMessage = 'Please enter amount';
    }

    if (!(duration && duration !== '')) {
        errorMessage = 'Please enter the duration';
    }

    if (!(resource && resource !== '')) {
        errorMessage = 'Please enter type of resource';
    }

    if (errorMessage) {
        return res.status(400).send(errorMessage);
    }

    if (!errorMessage) {
        try {
            const freezeAmount = await tronWeb.trx.getTransactionsToAddress(public_key);
            return res.status(200).json({freezeAmount});
        } catch (error) {
            return res.status(400).json({
                message: 'Sorry unable to Transaction To address',
                error: error
            });
        }
    }
}

/* Get transaction by addresses
 *  @parameter { String } Public_key
 *  Get all transaction by that address
 */
    exports.getTxbyAddress = async (req, res) => {

        const public_key = req.params.public_key;

        let errorMessage = null;

        if (!(public_key && public_key !== '')) {
            errorMessage = 'Please enter Public key of the sender';
        }

        if (!errorMessage) {
            try {
                let getTransaction = await tronWeb.trx.getTransactionsToAddress(public_key);
                return res.status(200).json({getTransaction});
            } catch (error) {
                return res.status(400).json({
                    message: 'Sorry unable to find Transaction To address',
                    error: error
                });
            }
        }
    }

/* Get transaction by hash or transaction Id
*  @parameter { String } txId txId or Hash block
*/
exports.getTxbyId = async (req, res) => {

    const txId = req.params.txId;

    let errorMessage = null;

    if (!(txId && txId !== '')) {
        errorMessage = 'Please enter transaction Id';
    }
    if (!errorMessage) {
        try {

            let getTransaction = await tronWeb.trx.getTransactionInfo(txId);

            return res.status(200).json({getTransaction});

        } catch (error) {
            return res.status(400).json({
                message: 'Sorry unable to find Transaction by Id',
                error: error
            });
        }
    }
}

/* Get Balance Information
*  @parameter { String } public_key
*/

exports.balance = async (req, res) => {
    const public_Key = req.params.public_Key;

    let errorMessage = null;

    if (!(publicKey && publicKey !== '')) {
        errorMessage = 'Please enter Public_Key';
    }
    if (!errorMessage) {
        try {
            const txPublic = await tronWeb.trx.getAccount(public_Key);
            return res.status(200).json({txPublic});

        } catch (error) {
            return res.status(400).json({
                message: 'Sorry unable to get balance',
                error: error
            });
        }
    }
}

/* Get Transaction To Address
*  @parameter { String } public_key
*/

exports.transactionsToAddress = async (req, res) => {
    const {public_key} = req.body;
    let errorMessage = null;

    if (!(public_key && public_key !== '')) {
        errorMessage = 'Please enter Public_Key';
    }
    if (!errorMessage) {
        try {
            const txInfo = await tronWeb.trx.getTransactionsToAddress(public_key,30,0);
            return res.status(200).json({txInfo});

        } catch (error) {
            return res.status(400).json({
                message: 'Sorry unable To Find Transaction To this Address',
                error: error
            });
        }
    }
}
exports.transactionsToAddress = async (req, res) => {
    const {public_key} = req.body;
    let errorMessage = null;

    if (!(public_key && public_key !== '')) {
        errorMessage = 'Please enter Public_Key';
    }
    if (!errorMessage) {
        try {
            const txInfo = await tronWeb.trx.getTransactionsToAddress(public_key,30,0);
            console.log(txInfo);
            return res.status(200).json({txInfo});

        } catch (error) {
            return res.status(400).json({
                message: 'Sorry unable To Find Transaction To this Address',
                error: error
            });
        }
    }
}

exports.getTransactionsFromAddress = async (req, res) => {
    const {public_key} = req.body;
    let errorMessage = null;

    if (!(public_key && public_key !== '')) {
        errorMessage = 'Please enter Public_Key';
    }
    if (!errorMessage) {
        try {
            const txInfo = await tronWeb.trx.getTransactionsFromAddress(public_key,30,0);
            console.log(txInfo);
            return res.status(200).json({txInfo});

        } catch (error) {
            return res.status(400).json({
                message: 'Sorry unable To Find Transaction To this Address',
                error: error
            });
        }
    }
}
