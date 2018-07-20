/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');
var add = require('./levelSandbox.js');

/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block{
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}

/* ===== Blockchain functions ==============================
|  Create functions that are used to interact with DB 		|
|  ========================================================*/

/* add a new Block to DB, if DB does not exist, create genesis Block
*  Parameter: A block
*/
function addBlock(newBlock){
    // key -1 contains the number of blocks in DB
    add.getLevelDBData(-1).then(function(value){  
      let height = parseInt(value) + 1;
      newBlock.height = height;
      //update number of blocks
      add.addLevelDBData(-1, height);
      newBlock.time = new Date().getTime().toString().slice(0,-3);
      //get value of previousHash
      add.getLevelDBData(height - 1).then(function(value1){
        newBlock.previousBlockHash = JSON.parse(value1).hash;
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
        add.addLevelDBData(height, JSON.stringify(newBlock));
      })
    //case: DB does not exist
    }).catch(function(err){
        newBlock.body = "First block in the chain - Genesis block";
        newBlock.height = 0;
        newBlock.time = new Date().getTime().toString().slice(0,-3);
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
        add.addLevelDBData (0, JSON.stringify(newBlock));
        add.addLevelDBData(-1, 0);
      })
}


/* since we cannot change a block, this function will add a false Block
*/
function addfalseBlock(newBlock){
    add.getLevelDBData(-1).then(function(value){  
      let height = parseInt(value) + 1;
      newBlock.height = height;
      add.addLevelDBData(-1, height);
      newBlock.time = new Date().getTime().toString().slice(0,-3);
      add.getLevelDBData(height - 1).then(function(value1){
        newBlock.previousBlockHash = "huhu";
        newBlock.hash = "haha";
        add.addLevelDBData(height, JSON.stringify(newBlock));
      })
    })
}



/*
* print out the value of BlockHeight
*/
function getBlockHeight(){
    add.getLevelDBData(-1).then(function(value){
        console.log(value);
      })
    }

/* getBlock information at a given Height
*/
function getBlock(blockHeight){
    add.getLevelDBData(blockHeight).then(function(value){
    console.log(JSON.parse(value));
    }).catch(function(err){
      console.log(err);
    })
}

 
/* helper function to handle promise for validateBlock
*/  
async function validateBlock_assist(blockHeight){
    //take the value of resolved
    value = await add.getLevelDBData(blockHeight).catch((err) => { console.log(err); });
    if (value != undefined) {
      let block = JSON.parse(value);
      let blockHash = block.hash;
      block.hash = ''
      let validBlockHash = SHA256(JSON.stringify(block)).toString();
      if (blockHash===validBlockHash) {
        return true;
      } else {
        console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
        return false;
      }
    } else {
      console.log(value)
    }

}

/* validate a Block and print out the result
*/
function validateBlock(blockHeight) {
    validateBlock_assist(blockHeight).then(function(value){
      console.log(value);
    })
}



/* helper function to handle promise and validate Chain
*/
async function validateChain_assist() {
    let errorLog = [];
    let height = await add.getLevelDBData(-1).catch((err) => { console.log(err); });
    for (var i = 0; i < height; i++) {
      let vali = await validateBlock_assist(i).catch((err) => { console.log(err); });
      if (!vali) errorLog.push(i + ": wrong hash ");
      let blocki = await add.getLevelDBData(i).catch((err) => { console.log(err); });
      let blockHash = JSON.parse(blocki).hash;    
      let blocki1 = await add.getLevelDBData(i+1).catch((err) => { console.log(err); });
      let previousHash = JSON.parse(blocki1).previousBlockHash;
      if (blockHash!==previousHash) {
        errorLog.push(i+1 + ": non match previous ");
      }
    }
    let vali = await validateBlock_assist(height).catch((err) => { console.log(err); });
    if (!vali) errorLog.push(i + ": wrong hash ");
    if (errorLog.length>0) {
      return 'Block errors = ' + errorLog.length +'\n' + 'Blocks: '+errorLog;
    } else {
      return 'No errors detected';
    }
}

/* Validate Blockchain and print out the result
*/
function validateChain(){
    validateChain_assist().then(function(value){
      console.log(value);
    })
}

(function theLoop (i) {
  setTimeout(function () {
    add.addDataToLevelDB('new Block(+i)');
    if (--i) theLoop(i);
  }, 100);
})(10);



