export class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    static loadPoint(pointInfo) {
        return new Point(pointInfo.x, pointInfo.y)
    }

    isSame(point) {
        return (this.x === point.x) && (this.y === point.y)
    }

    draw(context, {size=18, color='black', outline=false, hovered=false} = {}) {
        const radius = size * 0.5;
        
        if (outline) {
            context.beginPath();
            context.strokeStyle = 'yellow';
            context.arc(this.x, this.y, radius*0.8, 0, 2*Math.PI);
            context.stroke();
            return
        }
        
        if (hovered) {
            context.beginPath();
            context.fillStyle = 'yellow';
            context.arc(this.x, this.y, radius*0.6, 0, 2*Math.PI);
            context.fill();
            return
        }

        context.fillStyle = color;
        context.beginPath();
        context.arc(this.x, this.y, radius, 0, 2*Math.PI);
        context.fill();
    }
}