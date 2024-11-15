const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const randNum = () => {
  const key = crypto.randomBytes(32).toString('hex');
  const message = (crypto.randomBytes(1)[0]) & 1;
  const hmac = crypto.createHmac('sha3-256', key);
  hmac.update(message.toString());
  const hmacHex = hmac.digest('hex');

  return { key, message, hmacHex };
};

const calculateDiceSum = (diceString) => {
  return diceString.split(',').reduce((acc, num) => acc + Number(num), 0);
};

const validateDiceArguments = (args) => {
  if (args.length < 3) {
    console.error('Please provide at least 3 dice configurations.');
    return false;
  }

  for (const arg of args) {
    if (!/^\d+(,\d+)*$/.test(arg)) {
      console.error('Invalid dice configuration. Please use comma-separated integers.');
      return false;
    }
  }

  return true;
};

const promptUserSelection = (promptMessage, callback) => {
  rl.question(promptMessage, (userSelection) => {
    callback(userSelection.trim());
  });
};

const printDiceOptions = (args) => {
  args.forEach((arg, i) => console.log(`${i} - ${arg}`));
  console.log('X - exit\n? - help');
};

const processDiceChoice = (args, diceChoice, opponentDiceSum) => {
  if (diceChoice === 'X') {
    console.log("Game stopped.");
    rl.close();
    return;
  }

  if (diceChoice === '?') {
    displayHelpWithProbabilities(args);
    startGame(args); // Restart the game after showing help
    return;
  }

  if (isNaN(diceChoice) || diceChoice < 0 || diceChoice >= args.length) {
    console.log('Invalid dice choice.');
    startGame(args); // Restart the game for invalid input
    return;
  }

  const userDice = args[diceChoice];
  args.splice(diceChoice, 1);
  const userDiceSum = calculateDiceSum(userDice);
  console.log(`You chose: [${userDice}] (Sum: ${userDiceSum})`);

  if (userDiceSum > opponentDiceSum) console.log("User won!");
  else if (userDiceSum < opponentDiceSum) console.log("Computer won!");
  else console.log("It's a tie!");

  rl.close();
};

const computerMoveFirst = (args) => {
  const computerChoice = (crypto.randomBytes(args.length)[0]) & 1;
  const computerDice = args[computerChoice];
  args.splice(computerChoice, 1);
  const computerDiceSum = calculateDiceSum(computerDice);
  console.log(`I chose [${computerDice}] (Sum: ${computerDiceSum})`);

  console.log("Your turn. Choose your dice.");
  printDiceOptions(args);
  promptUserSelection('Your selection: ', (diceChoice) => {
    processDiceChoice(args, diceChoice, computerDiceSum);
  });
};

const userMoveFirst = (args) => {
  printDiceOptions(args);
  promptUserSelection('Your selection: ', (diceChoice) => {
    if (diceChoice === 'X') {
      console.log("Game stopped.");
      rl.close();
      return;
    }

    if (diceChoice === '?') {
      displayHelpWithProbabilities(args);
      startGame(args); // Restart the game after showing help
      return;
    }

    if (isNaN(diceChoice) || diceChoice < 0 || diceChoice >= args.length) {
      console.log('Invalid dice choice.');
      startGame(args); // Restart the game for invalid input
      return;
    }

    const userDice = args[diceChoice];
    args.splice(diceChoice, 1);
    const userDiceSum = calculateDiceSum(userDice);
    console.log(`You chose: [${userDice}] (Sum: ${userDiceSum})`);

    const computerChoice = (crypto.randomBytes(args.length)[0]) & 1;
    const computerDice = args[computerChoice];
    args.splice(computerChoice, 1);
    const computerDiceSum = calculateDiceSum(computerDice);
    console.log(`Computer chose: [${computerDice}] (Sum: ${computerDiceSum})`);

    if (userDiceSum > computerDiceSum) console.log("User won!");
    else if (userDiceSum < computerDiceSum) console.log("Computer won!");
    else console.log("It's a tie!");

    rl.close();
  });
};

const calculateWinProbabilities = (args) => {
  const diceSums = args.map((dice) =>
    calculateDiceSum(dice)
  );

  const probabilities = args.map((currentDice, index) => {
    const currentSum = diceSums[index];
    let wins = 0;
    let totalComparisons = 0;

    diceSums.forEach((opponentSum, opponentIndex) => {
      if (index !== opponentIndex) {
        totalComparisons++;
        if (currentSum > opponentSum) wins++;
      }
    });

    return { dice: currentDice, winProbability: (wins / totalComparisons) * 100 };
  });

  return probabilities;
};

const displayHelpWithProbabilities = (args) => {
  const probabilities = calculateWinProbabilities(args);

  console.log("Win probabilities for each dice:");
  probabilities.forEach(({ dice, winProbability }) => {
    console.log(`[${dice}] - ${winProbability.toFixed(2)}%`);
  });

  console.log("\nChoose your dice wisely!");
};

const startGame = (args, key, message, hmacHex) => {

  promptUserSelection('Your selection: ', (userSelection) => {
    if (userSelection === 'X') {
      console.log("Game stopped!")
      rl.close();
      return;
    }

    if (userSelection === '?') {
      displayHelpWithProbabilities(args);
      return;
    }

    if (userSelection !== '0' && userSelection !== '1') {
      console.log('Invalid input.');
      return;
    }

    if (Number(userSelection) === message) {
      console.log(`I chose ${message} (KEY=${key})\nYou make the first move.`);
      userMoveFirst(args);
    } else {
      console.log(`I chose ${message} (KEY=${key})\nI make the first move.`);
      computerMoveFirst(args);
    }
  });
};

const args = process.argv.slice(2);
if (!validateDiceArguments(args)) return rl.close();
console.log("Let's determine who makes the first move.");
const { key, message, hmacHex } = randNum();
console.log(`I've selected a random number in the range 0..1 (HMAC: ${hmacHex}).\nTry and guess my selection.`);
console.log('0 - 0\n1 - 1\nX - exit\n? - help');
startGame(args, key, message, hmacHex);
