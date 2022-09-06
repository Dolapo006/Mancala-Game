const Mancala = ('mancala')
  (function () {

    const instructionsButton = document.querySelector('.controls buttons.instructions');
    const newGame = document.querySelector('.controls buttons.new-game');
    const opponents = document.querySelectorAll('.opponent');
    const yourTurn = documet.querySelectorAll('.your-turn');
    const pickingHand = document.querySelector('hand.picking');
    const takingHand = document.querySelector('hand.taking');
    const holes = document.querySelectorAll('.hole')
    const board = document.querySelector('.board')
    const winnerTag = document.querySelectorAll('.winner-tag');
    let currentGame;
    let gameLine = [];

    const gameSummary = {
      [Mancala.event.TAKE_BEADS]: handleTakeBeads,
      [Mancala.event.MOVE_HAND]: handleToMoveBeads,
      [Mancala.event.DROP_BEADS]: handleToDropBeads,
      [Mancala.event.NEXT_PLAYER]: handleForNextPlayer,
      [Mancala.event.TAKE]: handleToTakeBeads,
      [Mancala.event.END_GAME]: handleToEndGame,
    };
//These are the actions of the game
    const GAME_SEQUENCE = 50;

    const ontakeBeads = gameTime(Mancala.event.TAKE_BEADS);
    const onMoveHand = gameTime(Mancala.event.MOVE_HAND);
    const onDropBeads = gameTime(Mancala.event.DROP_BEADS);
    const onNextPlayer = gameTime(Mancala.event.NEXT_PLAYER);
    const onNextTake = gameTime(Mancala.event.TAKE);
    const onEndGame = gameTime(Mancala.event.END_GAME);


    newGame.addEventListener('click', startNewGame);
    instructionsButton.addEventListener('click', clickInstructions)
    document.querySelectorAll('.side .hole').forEach((hole) => {
      hole.addEventListener('click', onHoleClick);
    })

    initial();
    gameFrame(handleGameLine);

    function startNewGame() {
      game = new Mancala();
      onGame('Yimika');
    }

    function onGame(secondPlayer) {
      game.on(Mancala.event.TAKE_BEADS, ontakeBeads);
      game.on(Mancala.event.MOVE_HAND, onMoveHand);
      game.on(Mancala.event.DROP_BEADS, onDropBeads);
      game.on(Mancala.event.NEXT_PLAYER, onNextPlayer);
      game.on(Mancala.event.TAKE, onNextTake);
      game.on(Mancala.event.END_GAME, onEndGame);

      opponents.forEach((opponent, index) => {
        opponent.style.display = 'block';
        if (index == 1) {
          const opponentName = opponent.querySelector('.opponent-name');
          opponentName.textContent = secondPlayer;
        }
      });
      initialDisplay(game);

      currentGame = null;
      gameLine = [];
    }

    function initialDisplay(game) {
      game.board.forEach((row, rowIndex) => {
        row.forEach((cellCount, cellIndex) => {
          const hole = getHoleAtPosition(rowIndex, cellIndex);
          initialBeadCount(hole, cellCount);
          setHoleSummaryText(getHoleSummary(hole), cellCount);
        })
      })

      game.taken.forEach((takenCount, index) => {
        const takenStore = takenByPlayer(index);
        initialBeadCount(takenStore, takenCount);
        setHoleSummaryText(
          getTakenStoreSummary(takenStore),
          takenCount,
        );
      });

      [pickingHand, takingHand].forEach((hand) => {
        const beadsInHand = hand.querySelectorAll('.bead');
        beadsInHand.forEach((bead) => {
          hand.removeChild(bead);
        });
      });
//This picks up the beads and drops them in other holes
      winnerTag.forEach((tag) => {
        tag.style.display = 'none';
      });

      nextPlayerTag(game.nextOpponent);
      ensureOnlyAllowedHoles();
    }

    function initialBeadCount(store, count) {
      store.querySelectorAll('.bead').forEach((bead) => {
        store.removeChild(bead);
      });

      for (let i = 0; i < count; i++) {
        const bead = document.createElement('div');
        bead.classList.add('bead');
        store.appendChild(bead);
        styleBead(bead);
      }
    }

    function ensureOnlyAllowedHoles() {
      const nextOpponent = game.nextOpponent;
      const otherOpponent = Mancala.toggleOpponent(game.nextOpponent);

      game.board[otherOpponent].forEach((_cell, cellIndex) => {
        const hole = getHoleAtPosition(otherOpponent, cellIndex);
        hole.classList.add('disabled');
      });
      game.board[nextOpponent].forEach((_cell, cellIndex) => {
        const hole = getHoleAtPosition(nextOpponent, cellIndex);
        if (game.permissibleMoves.includes(cellIndex)) {
          hole.classList.remove('disabled');
        } else {
          hole.classList.add('disabled');
        }
      });
    }
//only allow the player to drop beads in the holes that are acceptable otherwise prevent them from doing so.
    function nextPlayerTag(nextOpponent) {
      const otherOpponent = Mancala.toggleOpponent(nextOpponent);
      yourTurn.item(nextOpponent).style.display = 'inline-block';
      yourTurn.item(otherOpponent).style.display = 'none';
    }

    function styleBead(bead) {
      const parentWidth = bead.parentElement.clientWidth;
      const range = (40 * parentWidth) / 90;
      const offset = (-20 * parentWidth) / 90;
      const x = Math.round(Math.random() * 360);
      const y = Math.round(Math.random() * range) + offset;
      const z = Math.round(Math.random() * range) + offset;
      bead.style.transform = `rotate(${x}deg) translate(${y}px, ${z}px)`;
    }
    function getHoleSummary(hole) {
      return hole.parentElement.querySelector('.hole-summary');
    }

    function getTakenStoreSummary(takenStore) {
      return takenStore.querySelector('.hole-summary');
    }

    function setHoleSummaryText(element, count) {
      element.textContent = count == 0 ? '' : String(count);
    }

    function initial() {
      const beads = document.querySelectorAll('.bead');
      beads.forEach((bead) => {
        styleBead(bead);
      });
    }
    function onHoleClick(event) {
      if (game && !event.currentTarget.classList.contains('disabled')) {

        const startIndexOfCellIndex = 4;
        const cellIndex = event.currentTarget.classList
          .toString()
          .split(' ')
          .find((className) => className.includes('hole-'))[startIndexOfCellIndex];
        game.play(cellIndex - 1);
      }
    }
    function gameTime(type) {
      return function (...args) {
        gameLine.push({ type, args });
      };
    }

    function handleGameLine(time) {
      if (!currentGame) {
        if (gameLine.length == 0) {
          gameFrame(handleGameLine);
          return;
        }
//working on the current game being played and reducing the number of beads as the game progresses.
        currentGame = gameLine.shift();
        currentGame.start = time;
      }


      const fractionDone = (time - currentGame.start) / GAME_SEQUENCE;

      if (fractionDone > 1) {
        if (gameLine.length == 0) {
          ensureOnlyAllowedHoles();
        }

        currentGame = null;
        gameFrame(handleGameLine);
        return;
      }
      holes.forEach((hole) => {
        hole.classList.add('disabled');
      });

      const handler = gameSummary[currentGame.type];
      handler(currentGame, fractionDone);

      gameFrame(handleGameLine);
    }

    function handleTakeBeads(event, fractionDone) {
      if (fractionDone == 0) {
        const [row, column] = event.args;
        const [handX, handY] = getHolePosition(row, column);
        pickingHand.style.left = `${handX}px`;
        pickingHand.style.top = `${handY}px`;

        const hole = getHoleAtPosition(row, column);
        const beads = hole.querySelectorAll(`.bead`);

        beads.forEach((bead) => {
          hole.removeChild(bead);
          pickingHand.appendChild(bead);
        });
        setHoleSummaryText(getHoleSummary(hole), 0);
      }
    }
    //----------------------------------
    function getHolePosition(row, column) {
      const hole = getHoleAtPosition(row, column);
      const holeRect = hole.getBoundingClientRect();
      const boardRect = board.getBoundingClientRect();
      return [holeRect.y - boardRect.y, holeRect.z - boardRect.z];
    }
    function getHoleAtPosition(row, column) {
      return document.querySelector(`.side-${row + 1} .hole-${column + 1}`);
    }
    function handleToMoveBeads(event, fractionDone) {
      const [[initialRow, initialColumn], [nextRow, nextColumn]] = event.args;
      const [initialHoleX, initialHoleY] = getHolePosition(
        initialRow,
        initialColumn,
      );
      const [nextHoleX, nextHoleY] = getHolePosition(nextRow, nextColumn);
      const currentHandX = initialHoleX + fractionDone * (nextHoleX - initialHoleX);
      const currentHandY = initialPitY + fractionDone * (nextHoleY - initialHoleY);
      pickingHand.style.left = `${currentHandX}px`;
      pickingHand.style.top = `${currentHandY}px`;

      finishTheLastTaken();
    }
//----------------------------------
    function finishTheLastTaken() {
      const beadsInPickingHand = takingHand.querySelectorAll('.bead');
      const playerThatTookBeads = takingHand.style.top[0] == '-' ? 0 : 1;
      const takenStore = takenByPlayer(playerThatTookBeads);

      beadsInPickingHand.forEach((bead) => {
        takingHand.removeChild(bead);
        takenStore.appendChild(bead);
      });

      const holeSummary = getTakenStoreSummary(takenStore);
      setHoleSummaryText(
        holeSummary,
        Number(holeSummary.textContent) + beadsInPickingHand.length,
      );
    }
//----------------------------------
    function handleToDropBeads(event, fractionDone) {
      if (fractionDone == 0) {
        const beadInHand = pickingHand.querySelector('.bead');
        pickingHand.removeChild(beadInHand);

        const [row, column] = event.args;
        const hole = getHoleAtPosition(row, column);
        hole.appendChild(beadInHand);

        const holeSummary = getHoleSummary(hole);
        setHoleSummaryText(holeSummary, Number(holeSummary.textContent) + 1);
      }
    }

    function handleForNextPlayer(event, fractionDone) {
      if (fractionDone == 0) {
        const [nextOpponent] = event.args;
        nextPlayerTag(nextOpponent);
      }
    }

//----------------------------------
    function takenByPlayer(opponent) {
      return document.querySelector(`.opponent-${opponent + 1} .taken`);
    }

    function handleToTakeBeads(event, fractionDone) {

      if (fractionDone == 0) {
        finishTheLastTaken();
      }

      const [row, column, takingOpponent] = event.args;

      const hole = getHoleAtPosition(row, column);
      const beadsInHole = hole.querySelectorAll('.bead');
      beadsInHole.forEach((bead) => {
        hole.removeChild(bead);
        takingHand.appendChild(bead);
      });

      const [holeX, holeY] = getHolePosition(row, column);
      const [takenStoreX, takenStoreY] = getTakenStorePosition(
        takingOpponent,
      );

      const currentHandX = holeX + fractionDone * (takenStoreX - holeX);
      const currentHandY = holeY + fractionDone * (takenStoreY - holeY);
      takingHand.style.left = `${currentHandX}px`;
      takingHand.style.top = `${currentHandY}px`;

      setHoleSummaryText(getHoleSummary(hole), 0);
    }

    function handleToEndGame(event, fractionDone) {
      if (fractionDone == 0) {
        finishTheLastTaken();

        const [winner] = event.args;

        yourTurn.forEach((tag) => {
          tag.style.display = 'none';
        });

        if (winner == -1) {
          winnerTag.forEach((tag) => {
            tag.textContent = 'Draw!';
            tag.style.display = 'inline-block';
          });
          return;
        }

        const tag = winnerTag.item(winner);
        tag.textContent = 'Winner!';
        tag.style.display = 'inline-block';
      }
    }

    function getTakenStorePosition(opponent) {
      const takenStore = takenByPlayer(opponent);
      const takenStoreRect = takenStore.getBoundingClientRect();
      const boardRect = board.getBoundingClientRect();
      return [takenStoreRect.y - boardRect.x, takenStoreRect.z - boardRect.z];
    }
  })()
  window.alert(Mancala)