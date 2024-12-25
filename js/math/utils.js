import { Point } from "../primitives/point.js";

export function getNearestPoint(loc, points, threshold = 10) {
    let minDist = Number.MAX_SAFE_INTEGER;
    let nearest = null;
    for(const point of points) {
        let dist = getDistance(loc, point);
        if(dist < minDist && dist < threshold) {
            minDist = dist;
            nearest = point;
        }
    }

    return nearest
}

export function getNearestSegment(loc, segments, threshold = 10) {
    let minDist = Number.MAX_SAFE_INTEGER;
    let nearest = null;
    for(const seg of segments) {
        let dist = seg.minDistFromPoint(loc);
        if(dist < minDist && dist < threshold) {
            minDist = dist;
            nearest = seg;
        }
    }

    return nearest
}

export function getDistance(p1, p2) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

export function subtract(p1, p2) {
    return new Point(p1.x - p2.x, p1.y - p2.y);
}

export function add(p1, p2) {
    return new Point(p1.x + p2.x, p1.y + p2.y);
}

export function scale(p1, s1) {
    return new Point(p1.x * s1, p1.y * s1)
}

export function angleOfVector(point){
    return Math.atan2(point.y, point.x)
}

export function getPerpendicularVector(point){
    return new Point(-point.y, point.x)
}

export function translateVector(point, offset, angle) {
    return new Point(
        point.x + Math.cos(angle)*offset,
        point.y + Math.sin(angle)*offset,
    )
}

export function normalize(point) {
    if(Math.abs(magnitude(point)) < 0.001) 
        console.error('Magnitude is equal to or very close to zero while normalizing!');
    return scale(point, 1 / magnitude(point))
}

export function magnitude(point) {
    return Math.hypot(point.x, point.y)
}

export function average(p1, p2) {
    return new Point((p1.x + p2.x)*0.5, (p1.y + p2.y)*0.5)
}

export function dot(p1, p2) {
    return p1.x * p2.x + p1.y * p2.y
}

export function getIntersectionPoint(line1, line2) {
    // console.log(line1, line2);
    const [x1, x2] = [line1[0].x, line1[1].x];
    const [y1, y2] = [line1[0].y, line1[1].y];
    const [a1, a2] = [line2[0].x, line2[1].x];
    const [b1, b2] = [line2[0].y, line2[1].y];

    // console.log(x1, x2, y1, y2, a1, a2, b1, b2);

    /*  x1 + (x2-x1)t = a1 + (a2-a1)u
            (x1-a2) + (x2-x1)t = (a2-a1)u
            (a1-x1) + (a2-a1)u = (x2-x1)t
        y1 + (y2-y1)t = b1 + (b2-b1)u
            (y1-b2) + (y2-y1)t = (b2-b1)u
            (b1-y1) + (b2-b1)u = (y2-y1)t

        (a2-a1)((y1-b2) + (y2-y1)t) = (b2-b1)((x1-a2) + (x2-x1)t)
        ((y2-y1)(a2-a1)-(b2-b1)(x2-x1))t = (x1-a2)(b2-b1) - (y1-b2)(a2-a1)

        (x2-x1)((b1-y1) + (b2-b1)u) = (y2-y1)((a1-x1) + (a2-a1)u)
        ((b2-b1)(x2-x1)-(a2-a1)(y2-y1))u = (a1-x1)(y2-y1)-(b1-y1)(x2-x1)
    */
    const tTop = (x1-a2)*(b2-b1) - (y1-b2)*(a2-a1);
    const bottom = (y2-y1)*(a2-a1) - (b2-b1)*(x2-x1);
    const uTop = (b1-y1)*(x2-x1)-(a1-x1)*(y2-y1);

    const eps = 0.001;
    if(Math.abs(bottom) < eps) return null
    
    let t = tTop / bottom;
    let u = uTop / bottom;
    if(t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return {
                x: lerp(x1, x2, t),
                y: lerp(y1, y2, t),
                offset: t
        }
    }
}

export function lerp(A, B, t) {
    return A + (B-A)*t
}

export function invLerp(A, B, v) {
    return (v - A)/(B - A)
}

export function lerp2D(A, B, t) {
    return new Point(lerp(A.x, B.x, t), lerp(A.y, B.y, t))
}

export function getRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsla(${hue}, 100%, 70%)`
}

export function Hash(object) {
    return JSON.stringify(object)
}

export function degToRad(angle) {
    return angle * Math.PI / 180
}

export function crossProduct2D(A, B) {
    return (A.x * B.y) - (A.y * B.x);
}