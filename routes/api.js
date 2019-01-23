var express = require('express');
var router = express.Router();
const trx = require('../controllers/Trx'); /* Importing Trx controller */

/* Account Creation */
router.post('/sendTrx',trx.sendTrx);
router.post('/sendToken',trx.sendToken);

/* token Routes */
router.post('/createToken',trx.createToken);
router.get('/CreateAccount',trx.createAccount);

/* Transactions Routes*/
router.get('/getTxbyAddress/:public_key',trx.getTxbyAddress);
router.get('/getTxbyId/:txId',trx.getTxbyId);
router.post('/transactionsToAddress',trx.transactionsToAddress);
router.post('/transactionsFromAddress',trx.getTransactionsFromAddress);


/* Freeze Tron Routes */
router.post('/freezeTrx/',trx.freezeTrx);

/* Balance Routes */
router.get('/balance/:public_key',trx.balance);

module.exports = router;
