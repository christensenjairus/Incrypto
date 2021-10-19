import * as path from 'path';
import * as SVG from 'svg.js';
// import 'svg.draggable.js';

const file = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const rank = ['8', '7', '6', '5', '4', '3', '2', '1'];

export const enum Color {
    White,
    Black
}

export const enum PieceKind {
    King,
    Queen,
    Rook,
    Bishop,
    Knight,
    Pawn
}

export class Piece {
    color: Color;
    type: PieceKind;
    square: Square;

    constructor(color: Color, type: PieceKind, square: Square) {
        this.color = color;
        this.type = type;
        this.square = square;
    }

    is_white(): boolean {
        return this.color == Color.White;
    }

    is_black(): boolean {
        return this.color == Color.Black;
    }

    img(): string {
        return path.join(__dirname, '../static/' + this.color + this.type + '.svg');
    }

    id(): string {
        return 'piece-' + this.square.algebraic();
    }

    algebraic(): string {
        return this.square.algebraic();
    }
}

export class Square {
    col: number;
    row: number;

    constructor(x: number, y: number) {
        this.col = x;
        this.row = y;
    }

    algebraic(): string {
        return file[this.col] + rank[this.row];
    }
}

export default class ChessBoard {
    private board: SVG.Doc;
    private pieces = {} as { string: Piece };

    constructor(divId: string) {
        this.board = SVG(divId)
            .size('100%', '100%')
            .viewbox(0, 0, 8, 8);

        this.paintBoard();
    }

    private paintBoard() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const pos = file[col] + rank[row];
                const color = (row + col) % 2 == 0 ? 'white-square' : 'black-square';

                let square = this.board
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
                })
            }
        }
    }

    placePiece(color: Color, kind: PieceKind, at: Square) {
        const piece = new Piece(color, kind, at);
        const img = piece.img();

        this.pieces[at.algebraic()] = piece;
        let sq = this.board
            .image(img, 1, 1)
            .move(piece.square.col, piece.square.row)
            .addClass('piece')
            .id(piece.id())
            .attr({
                "pointer-events": "none",
            });
    }

    clearBoard() {
        for (let id in this.pieces) {
            this.board.select("#piece-" + id).each(function (idx) {
                this.remove();
            })
        }

        this.pieces = {} as { string: Piece };
    }

    initialPosition() {
        const placement = [
            PieceKind.Rook,
            PieceKind.Knight,
            PieceKind.Bishop,
            PieceKind.Queen,
            PieceKind.King,
            PieceKind.Bishop,
            PieceKind.Knight,
            PieceKind.Rook
        ];

        for (let col = 0; col < 8; col++) {
            this.placePiece(Color.White, PieceKind.Pawn, new Square(col, 6));
            this.placePiece(Color.Black, PieceKind.Pawn, new Square(col, 1));
            this.placePiece(Color.White, placement[col], new Square(col, 7));
            this.placePiece(Color.Black, placement[col], new Square(col, 0));
        }
    }
}