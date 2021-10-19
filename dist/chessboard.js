"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Square = exports.Piece = void 0;
var path = require("path");
var SVG = require("svg.js");
// import 'svg.draggable.js';
var file = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
var rank = ['8', '7', '6', '5', '4', '3', '2', '1'];
var Piece = /** @class */ (function () {
    function Piece(color, type, square) {
        this.color = color;
        this.type = type;
        this.square = square;
    }
    Piece.prototype.is_white = function () {
        return this.color == 0 /* White */;
    };
    Piece.prototype.is_black = function () {
        return this.color == 1 /* Black */;
    };
    Piece.prototype.img = function () {
        return path.join(__dirname, '../static/' + this.color + this.type + '.svg');
    };
    Piece.prototype.id = function () {
        return 'piece-' + this.square.algebraic();
    };
    Piece.prototype.algebraic = function () {
        return this.square.algebraic();
    };
    return Piece;
}());
exports.Piece = Piece;
var Square = /** @class */ (function () {
    function Square(x, y) {
        this.col = x;
        this.row = y;
    }
    Square.prototype.algebraic = function () {
        return file[this.col] + rank[this.row];
    };
    return Square;
}());
exports.Square = Square;
var ChessBoard = /** @class */ (function () {
    function ChessBoard(divId) {
        this.pieces = {};
        this.board = SVG(divId)
            .size('100%', '100%')
            .viewbox(0, 0, 8, 8);
        this.paintBoard();
    }
    ChessBoard.prototype.paintBoard = function () {
        for (var row = 0; row < 8; row++) {
            for (var col = 0; col < 8; col++) {
                var pos = file[col] + rank[row];
                var color = (row + col) % 2 == 0 ? 'white-square' : 'black-square';
                var square = this.board
                    .rect(1, 1)
                    .move(row, col)
                    .addClass('board-square')
                    .addClass(color)
                    .id(pos);
                square.mouseover(function () {
                    this.addClass('selected');
                });
                square.mouseout(function () {
                    this.removeClass('selected');
                });
            }
        }
    };
    ChessBoard.prototype.placePiece = function (color, kind, at) {
        var piece = new Piece(color, kind, at);
        var img = piece.img();
        this.pieces[at.algebraic()] = piece;
        var sq = this.board
            .image(img, 1, 1)
            .move(piece.square.col, piece.square.row)
            .addClass('piece')
            .id(piece.id())
            .attr({
            "pointer-events": "none",
        });
    };
    ChessBoard.prototype.clearBoard = function () {
        for (var id in this.pieces) {
            this.board.select("#piece-" + id).each(function (idx) {
                this.remove();
            });
        }
        this.pieces = {};
    };
    ChessBoard.prototype.initialPosition = function () {
        var placement = [
            2 /* Rook */,
            4 /* Knight */,
            3 /* Bishop */,
            1 /* Queen */,
            0 /* King */,
            3 /* Bishop */,
            4 /* Knight */,
            2 /* Rook */
        ];
        for (var col = 0; col < 8; col++) {
            this.placePiece(0 /* White */, 5 /* Pawn */, new Square(col, 6));
            this.placePiece(1 /* Black */, 5 /* Pawn */, new Square(col, 1));
            this.placePiece(0 /* White */, placement[col], new Square(col, 7));
            this.placePiece(1 /* Black */, placement[col], new Square(col, 0));
        }
    };
    return ChessBoard;
}());
exports.default = ChessBoard;
