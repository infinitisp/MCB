Boards = new Mongo.Collection("boards");
Messages = new Mongo.Collection("messages");

if (Meteor.isClient) {
    var board,
    game = new Chess(),
    chatSel = false,
    boardEl,
    statusEl,
    pgnEl,
    squareToHighlight;

    // do not pick up pieces if the game is over
    // only pick up pieces for the side to move
    var onDragStart = function(source, piece, position, orientation) {
      if (game.game_over() === true ||
          (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
          (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
      }
    };

    var onDrop = function(source, target, piece, newPos, oldPos, orientation) {
      // see if the move is legal
      var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
      });

      // illegal move
      if (move === null) return 'snapback';

      //remove highlights
      boardEl.find('.square-55d63')
        .removeClass('highlight');
      boardEl.find('.square-' + source).addClass('highlight');
      boardEl.find('.square-' + target).addClass('highlight');
    };

    // update the board position after the piece snap 
    // for castling, en passant, pawn promotion
    var onSnapEnd = function() {
      //board.position(game.fen());
      Boards.update(Boards.findOne()._id, {$set: {pgn: game.pgn()}});
    };

    var updateStatus = function() {
      var status = '';

      var moveColor = 'White';
      if (game.turn() === 'b') {
        moveColor = 'Black';
      }

      // checkmate?
      if (game.in_checkmate() === true) {
        status = 'Game over, ' + moveColor + ' is in checkmate.';
      }

      // draw?
      else if (game.in_draw() === true) {
        status = 'Game over, drawn position';
      }

      // game still on
      else {
        status = moveColor + ' to move';

        // check?
        if (game.in_check() === true) {
          status += ', ' + moveColor + ' is in check';
        }
      }

      statusEl.html(status);
      pgnEl.html(game.pgn());
    };

    Template.body.events({
    });

    Template.chessBoard.rendered = function () {
      statusEl = $('#status');
      pgnEl = $('#pgn');
      boardEl = $('#board');

      var cfg = {
          draggable: true,
          position: 'start',
          onDragStart: onDragStart,
          onDrop: onDrop,
          onSnapEnd: onSnapEnd
        };
        board = new ChessBoard('board', cfg);


        Tracker.autorun(function () {
          if (Boards.findOne()) {
            var p = Boards.findOne().pgn;
            game.load_pgn(p);
            board.position(game.fen(),false);
            updateStatus();
          } else {}
        });

        $('#flipOrientationBtn').on('click', board.flip);
        $('#undoBtn').on('click', function () {
          game.undo();
          Boards.update(Boards.findOne()._id, {$set: {pgn: game.pgn()}});
        });
        $('#resetGameBtn').on('click', function () {
          if (confirm('Are you sure you want to reset the game? All game progress will be lost.')) {
            Boards.update(Boards.findOne()._id, {$set: {pgn: ''}});
          } else { 
            //Do nothing
          }
        });
    };
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    if (Boards.find().count() === 0) {
      Boards.insert({pgn: ''})
    }
  });
}