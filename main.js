const triangle_large = [
    {x: 0, y: 0},
    {x: 0, y: 60},
    {x: 75, y: 30}
];

const triangle_large_center = {
    x: 25,
    y: 30
};

const triangle_medium = [
    {x: 0, y: 0},
    {x: 0, y: 40},
    {x: 48, y: 20}
];

const triangle_medium_center = {
    x: 16,
    y: 20
};

const triangle_small = [
    {x: 0, y: 0},
    {x: 0, y: 30},
    {x: 36, y: 15}
]

const triangle_small_center = {
    x: 12,
    y: 15
}

let triangle_size = "medium";

let triangle = triangle_medium, triangle_center = triangle_medium_center;

let intervalId;
let body;

let triangles = [];
let colliders = [];
let conflict_list = [];

let savedConflictBoards = [];
let savedNonConflictBoards = [];

let width;
let height;

let min_triangles = 15;
let max_triangles = 20;

let boards = 15;
let min_conflicts = 5;
let max_conflicts = 9;
let conflict_amount;
let conflicts_passed = 0;
let non_conflicts_passed = 0;

let scores = [];
let conflict_pressed = false;

let hax = false;

let canvas;
let ctx;

let conflictExists;
let conflictHasBeenPressed;

let over = false;

function ccw(A,B,C) {
    return (C.y-A.y) * (B.x-A.x) > (B.y-A.y) * (C.x-A.x);
}

//Return true if line segments AB and CD intersect
function _intersects(A,B,C,D) {
    return ccw(A,C,D) != ccw(B,C,D) && ccw(A,B,C) != ccw(A,B,D);
}

function intersects(A, B, C, D) {
    let a = A;
    let b = B;
    let c = C;
    let d = D;
    if (A.x > B.x) {
        a = B;
        b = A;
    }
    if (C.x > D.x) {
        c = D;
        d = C;
    }
    return _intersects(a, b, c, d);
}

function limit(x, lim, reset = true) {
    if (x >= lim) {
        if (reset) return (x - (lim * Math.floor(x / lim)));
        else return lim;
    }
    return x;
}

function isRoundEqual(a, b, accuracy = 10) {
    return (a >= b - accuracy && a <= b + accuracy);
}

//function getCenter(x, y, deg) {
//    let col = getCollider(x, y, deg);
//    let o = {
//        x: col.x + (col.width / 2),
//        y: col.y + (col.height / 2)
//    };
//    return o;
//}

function getCenter(x, y, deg) {
    let c = rotatePoint(triangle_center.x, triangle_center.y, deg);
    let o = {
        x: c.x + x,
        y: c.y + y
    };
    return o;
}

function getRelativeCenter(deg) {
    return getCenter(0, 0, deg);
}

function getPoint(x, y, deg) {
    let p = rotatePoint(triangle[2].x, triangle[2].y, deg);
    p.x += x;
    p.y += y;
    return p;
}

function getCollider(x, y, deg) {
    let tr = [
        rotatePoint(triangle[0].x, triangle[0].y, deg),
        rotatePoint(triangle[1].x, triangle[1].y, deg),
        rotatePoint(triangle[2].x, triangle[2].y, deg)
    ];
    let x1 = Math.min(tr[0].x, tr[1].x, tr[2].x);
    let x2 = Math.max(tr[0].x, tr[1].x, tr[2].x);
    let y1 = Math.min(tr[0].y, tr[1].y, tr[2].y);
    let y2 = Math.max(tr[0].y, tr[1].y, tr[2].y);
    let o = {
        x: x1 + x,
        width: x2 + Math.abs(x1),
        y: y1 + y,
        height: y2 + Math.abs(y1)
    };
    return o;
}

function choice(a, b, chance = 50.0) {
    if (Math.random() <= (chance / 100.0)) {
        return a;
    }
    else {
        return b;
    }
}

function isPointIn(point, col) {
    if (point.x > col.x && point.x < point.x + col.width) {
        if (point.y > col.y && point.y < col.y + col.height) {
            return true;
        }
    }
    return false;
}

function collidesWith(col, col2) {
    if (col.x > col2.x + col2.width || col2.x > col.x + col.width) {
        return false;
    }
    if (col.y > col2.y + col2.height || col2.y > col.y + col.height) {
        return false;
    }
    return true;
}

function randint(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
}

function conflict_press() {
    conflict_pressed = true;
    if (conflictExists) body.style.backgroundColor = "rgb(30, 140, 30)";
    else body.style.backgroundColor = "rgb(140, 30, 30)";
}

function rotatePoint(_x, _y, _deg, tr = true) {
    let x, y;
    if (tr) {
        x = _x - 25;
        y = _y - 20;
    }
    else {
        x = _x;
        y = _y;
    }
    let deg = (_deg / 180) * Math.PI;
    let point = {
        x: (x * Math.cos(deg)) - (y * Math.sin(deg)),
        y: (y * Math.cos(deg)) + (x * Math.sin(deg))
    };
    return point;
}

function getAngle(x, y) {
    if (x == 0) {
        if (y > 0) return 90;
        if (y < 0) return 270;
        else return 0;
    }
    if (y == 0) {
        if (x > 0) return 0;
        if (x < 0) return 180;
        else return 0;
    }
    let c = y;
    let a = x;
    let angle = 0;

    if (y < 0) {
        a = -a;
        angle += 180;
    }

    let b = Math.sqrt((a*a) + (c*c) - (2*a*c * Math.cos(Math.PI / 2)));
    angle = limit(angle + (Math.acos(((b*b) + (a*a) - (c*c))/(2*b*a))) * 180 / Math.PI, 360);
    return angle;
}

function drawTriangle(x, y, deg) {
    let tr = [
        rotatePoint(triangle[0].x, triangle[0].y, deg),
        rotatePoint(triangle[1].x, triangle[1].y, deg),
        rotatePoint(triangle[2].x, triangle[2].y, deg)
    ];

    //let c = ctx.fillStyle;
    //ctx.fillStyle = "red";
    //let col = getCollider(x, y, deg);
    //ctx.fillRect(col.x, col.y, col.width, col.height);
    //ctx.fillStyle = c;

    ctx.beginPath();
    ctx.moveTo(tr[0].x + x, tr[0].y + y);
    ctx.lineTo(tr[1].x + x, tr[1].y + y);
    ctx.lineTo(tr[2].x + x, tr[2].y + y);
    ctx.closePath();
    ctx.fill();
}

function isBetween(x, a, b) {
    return (x > Math.min(a, b) && x < Math.max(a, b));
}

function canPlaceHere(x, y, deg) {
    if (x < 50 || y < 50 || x > width - 50 || y > height - 50) return false;
    let f = true;
    let col = getCollider(x, y, deg);
    colliders.forEach((c) => {
        if (collidesWith(col, c)) {
            f = false;
        }
    });
    return f;
}

function p(x, y) {
    return {x: x, y: y};
}

function getLineLength(a, b) {
    let c = Math.max(a.x) - Math.min(b.x);
    let d = Math.max(a.y) - Math.min(b.y);
    return Math.sqrt((c*c) + (d*d));
}

function conflicts(x, y, deg) {
    let po = getPoint(x, y, deg);
    let c = false;

    triangles.forEach((t) => {
        let point = getPoint(t.x, t.y, t.deg);
        if (isPointingAt(po.x, po.y, deg, point.x, point.y) && isRoundEqual(deg, limit(t.deg + 180, 360), 4)) {
            if (isPointingAt(point.x, point.y, t.deg, po.x, po.y)) {
                c = true;
                conflict_list.push({x: x, y: y, deg: deg, x2: t.x, y2: t.y, deg2: t.deg});
                return;
            }
        }
    });
    return c;
}

function recheckConflicts(i = -1) {
    let new_conflicts = [];
    if (i == -1) {
        conflict_list.forEach((conf, _i) => {
            let barricade = false;
            let col1 = getCollider(conf.x, conf.y, conf.deg);
            let col2 = getCollider(conf.x2, conf.y2, conf.deg2);
            let po = getPoint(conf.x, conf.y, conf.deg);
            let po2 = getPoint(conf.x2, conf.y2, conf.deg2);
            colliders.forEach((col) => {
                if ((col.x != col1.x || col.y != col1.y) && (col.x != col2.x || col.y != col2.y)) {
                    if (collidesWith(col, {x: Math.min(conf.x, conf.x2), y: Math.min(conf.y, conf.y2), 
                        width: Math.max(conf.x, conf.x2) - Math.min(conf.x, conf.x2), height: Math.max(conf.y, conf.y2) - Math.min(conf.y, conf.y2)})) {

                        if (intersects(p(col.x, col.y), p(col.x + col.width, col.y + height), po, po2)
                        ||  intersects(p(col.x, col.y + col.height), p(col.x + col.width, col.y), po, po2)) {
                            barricade = true;
                            return;
                        }
                    }
                }
            });
            if (!barricade) {
                new_conflicts.push(conf);
            }
        });
    }
    else {
        conflict_list.forEach((conf, _i) => {
            let barricade = false;
            let col1 = getCollider(conf.x, conf.y, conf.deg);
            let col2 = getCollider(conf.x2, conf.y2, conf.deg2);
            let po = getPoint(conf.x, conf.y, conf.deg);
            let po2 = getPoint(conf.x2, conf.y2, conf.deg2);
            let col = colliders[i];
            if ((col.x != col1.x || col.y != col1.y) && (col.x != col2.x || col.y != col2.y)) {
                if (collidesWith(col, {x: Math.min(conf.x, conf.x2), y: Math.min(conf.y, conf.y2), 
                    width: Math.max(conf.x, conf.x2) - Math.min(conf.x, conf.x2), height: Math.max(conf.y, conf.y2) - Math.min(conf.y, conf.y2)})) {

                    if (intersects(p(col.x, col.y), p(col.x + col.width, col.y + height), po, po2)
                    ||  intersects(p(col.x, col.y + col.height), p(col.x + col.width, col.y), po, po2)) {
                        barricade = true;
                        return;
                    }
                }
            }
            if (!barricade) {
                new_conflicts.push(conf);
            }
        });
    }
    conflict_list = new_conflicts;
}


function getSlope(point, point2) {
    if (point.x > point2.x) {
        return (point.y - point2.y) / (point.x - point2.x);
    }
    else {
        return (point2.y - point.y) / (point2.x - point.x);
    }
}

function fSegment(x, a, b) {
    if (a.x == b.x) {
        return Math.max(a.y, b.y);
    }
    else if (a.x < b.x) {
        return (getSlope(a, b))*x + a.y;
    }
    else {
        return (getSlope(a, b))*x + b.y;
    }
}

function placeTriangle(x, y, deg, center = false) {
    let po = {x: 0, y: 0};
    if (center) {
        po = getRelativeCenter(deg);
        //po = {x: po.x - x, y: po.y - y};
    }
    triangles.push({x: x - po.x, y: y - po.y, deg: deg});
    colliders.push(getCollider(x - po.x, y - po.y, deg));
}

function centerTriangle(x, y, deg, reverse = false) {
    let po = getRelativeCenter(deg);
    if (reverse) return {x: x + po.x, y: y + po.y, deg: deg};
    else return {x: x - po.x, y: y - po.y, deg: deg}
}

function centerTriangleByPoint(x, y, deg, reverse = false) {
    let po = getPoint(x, y, deg);
    if (reverse) return {x: x - (x - po.x), y: y - (y - po.y), deg};
    else return {x: po.x, y: po.y, deg};
}

function generateTriangle(checkConflicts = true, _deg = -1) {
    let x = randint(50, width - 100);
    let y = randint(50, height - 100);
    let deg;
    if (_deg == -1) deg = randint(0, 360);
    else deg = _deg;

    while (!canPlaceHere(x, y, deg)) {
        x = randint(50, width - 100);
        y = randint(50, height - 100);
        deg = randint(0, 360);
    }
    if (checkConflicts) conflicts(x, y, deg);
    placeTriangle(x, y, deg);
}

function loadBoard() {
    conflictExists = choice(true, false, 40);
    if (conflictExists && savedConflictBoards.length > 0) {
        conflictExists = true;
        loadConflict();
    }
    else if (savedNonConflictBoards.length > 0 || non_conflicts_passed < boards - conflict_amount - 1){
        if (savedNonConflictBoards.length == 0) generateBoard(false);
        conflictExists = false;
        loadNonConflict();
    }
    else if (savedConflictBoards.length > 0 || conflicts_passed < conflict_amount - 1) {
        if (savedConflictBoards.length == 0) generateBoard(true);
        conflictExists = true;
        loadConflict();
    }
    else {
        return false;
    }
    return true;
}

function drawBoard() {
    triangles.forEach((t) => {
        drawTriangle(t.x, t.y, t.deg);
    });
}

function distanceFromWall(x, y) {
    return Math.min(x, y, width - x, height - y);
}

function setCanvasSize() {
    let w = 0.96 * window.innerWidth;
    let h = 0.86 * window.innerHeight;

    if (w != width || h != height) {
        width = w;
        height = h;
        canvas.width = w;
        canvas.height = h;
    }
}

function update(first_time = false) {
    body.style.backgroundColor = "rgb(30, 30, 30)";
    if (!first_time) {
        scores.push({conflict: conflictExists, pressed: conflict_pressed});
    }
    conflict_pressed = false;
    width = canvas.width;
    height = canvas.height;
    ctx.fillStyle = "black";
    ctx.clearRect(0, 0, width, height);
    if (non_conflicts_passed >= boards - conflict_amount - 1 && conflicts_passed >= conflict_amount - 1 && savedConflictBoards.length == 0 && savedNonConflictBoards.length == 0) {
        finish();
    }
    else {
        loadBoard();
        draw();
    }
}

function draw() {
    drawBoard();
    if (hax) {
        ctx.fillStyle = "yellow";
        conflict_list.forEach((t) => {
            drawTriangle(t.x, t.y, t.deg);
            drawTriangle(t.x2, t.y2, t.deg2);
        });
    }
}

function loadConflict() {
    triangles = savedConflictBoards[0].triangles;
    colliders = savedConflictBoards[0].colliders;
    conflict_list = savedConflictBoards[0].conflict_list;
    savedConflictBoards.shift();
}

function loadNonConflict() {
    triangles = savedNonConflictBoards[0].triangles;
    colliders = savedNonConflictBoards[0].colliders;
    conflict_list = savedNonConflictBoards[0].conflict_list;
    savedNonConflictBoards.shift();
}

function saveConflict() {
    savedConflictBoards.push({
        triangles: triangles,
        colliders: colliders,
        conflict_list: conflict_list
    });
}

function saveNonConflict() {
    savedNonConflictBoards.push({
        triangles: triangles,
        colliders: colliders,
        conflict_list: conflict_list
    });
}

function generateBoard(_conflictExists = false) {
    if (!_conflictExists) {
        do {
            triangles = [];
            colliders = [];
            conflict_list = [];
            let triangle_amount = randint(min_triangles, max_triangles);
            for (let i = 0; i < triangle_amount; i++) {
                generateTriangle();
            }
            recheckConflicts();
        } while (conflict_list.length > 0);
        saveNonConflict();
        non_conflicts_passed++;
    }
    else {
        generateConflictBoard();
        conflicts_passed++;
    }
}

function generateConflictBoard(triangle_amount = -1) {
    let success;
    do {
        success = true;
        triangles = [];
        colliders = [];
        conflict_list = [];
        
        placePair();

        
        if (triangle_amount == -1) triangle_amount = randint(min_triangles, max_triangles) - 2;
        //alert(`Generating ${triangle_amount} triangles.`)

        for (let i = 0; i < triangle_amount; i++) {
            let temp_triangles = triangles.copyWithin();
            let temp_conflicts = conflict_list.copyWithin();
            let temp_colliders = colliders.copyWithin();
            let n = 0;
            let retry = false;
            do {
                triangles = temp_triangles.copyWithin();
                conflict_list = temp_conflicts.copyWithin();
                colliders = temp_colliders.copyWithin();
                generateTriangle();
                recheckConflicts();
                n++;
                if (n > 20) {
                    retry = true;
                    break;
                }
            } while (conflict_list.length == 0);
            if (retry) {
                //alert("Failed. Retrying.");
                success = false;
                break;
            }
        }
    } while (!success);

    saveConflict();
}

let frame = 5;
function _update(first_time = false) {
    if (conflicts_passed < conflict_amount) {
        generateBoard(true);
    }
    else if (non_conflicts_passed < boards - conflict_amount) {
        generateBoard(false);
    }
    if (frame == 5) {
        if (!over) update(first_time);
        frame = 0;
    }
    frame++;
}

function isPointingAt(x1, y1, deg, x2, y2, margin = 16) {
    let distance = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    let po = rotatePoint(distance, 0, deg, false);
    po.x += x1;
    po.y += y1;

    return isRoundEqual(po.x, x2, margin) && isRoundEqual(po.y, y2, margin);
}

function getTriangle(x, y, deg) {
    return {x: x, y: y, deg: deg};
}

function placePair() {
    let x, y, deg, dist;
    
    do {
        x = randint(50, width - 100);
        y = randint(50, height - 100);
        deg = randint(0, 360);
        dist = distanceFromWall(x, y);
    } while (!canPlaceHere(x, y, deg) && dist < 200);
    placeTriangle(x, y, deg);

    let cen = getCenter(x, y, deg);
    let x2 = cen.x;
    let po, newTr;

    let i = 0;
    do {
        x = randint(160, width - 100);
        po = rotatePoint(x, 0, deg, false);
        newTr = getTriangle(x2 + po.x, y + po.y, limit(180 + deg, 360));
        //let newTr = centerTriangleByPoint(x2 + po.x, y + po.y, limit(180 + deg, 360), true);
        i++;
    } while (!canPlaceHere(newTr.x, newTr.y, newTr.deg) && i < 20);
    if (i >= 20) {
        i = 40
        do {
            x = width * (i / 40);
            po = rotatePoint(x, 0, deg, false);
            newTr = getTriangle(x2 + po.x, y + po.y, limit(180 + deg, 360));
            i--;
        } while (i > 0 && !canPlaceHere(newTr.x, newTr.y, newTr.deg));
    }
    
    conflicts(newTr.x, newTr.y, newTr.deg);
    placeTriangle(newTr.x, newTr.y, newTr.deg);
    recheckConflicts();
}

function start() {
    clearInterval(intervalId);
    over = false;
    conflict_amount = randint(min_conflicts, max_conflicts);

    conflicts_passed = 0;
    non_conflicts_passed = 0;

    triangles = [];
    colliders = [];
    conflict_list = [];
    scores = [];

    savedConflictBoards = [];
    savedNonConflictBoards = [];

    frame = 5;
    _update(true);
    intervalId = setInterval(_update, 1000);

    //while (conflict_list.length == 0) update();
}

function updateSettings() {
    min_triangles = Number(document.getElementById("min_triangles").value);
    max_triangles = Number(document.getElementById("max_triangles").value);
    min_conflicts = Number(document.getElementById("min_conflicts").value);
    max_conflicts = Number(document.getElementById("max_conflicts").value);
    boards = Number(document.getElementById("boards").value);
    hax = document.getElementById("hax").checked;
    triangle_size = document.getElementById("triangle_size").value;
    switch (triangle_size) {
        case "small":
            triangle = triangle_small;
            triangle_center = triangle_small_center;
            break;
        case "medium":
            triangle = triangle_medium;
            triangle_center = triangle_medium_center;
            break;
        case "large":
            triangle = triangle_large;
            triangle_center = triangle_large_center;
            break;
    }
    start();
    document.getElementById("settings").hidden = true;
}

function finish() {
    over = true;
    document.getElementById("game_over_screen").hidden = false;
    let correct = 0;
    let count = 0;
    scores.forEach((score) => {
        if (score.conflict == score.pressed) correct++;
        count++;
    });
    document.getElementById("score").innerText = `You scored ${correct} out of ${count}. That is ${Math.round(correct/count*100)}%.`;
}

function screenClick(event) {
    alert(`${event.clientX}, ${event.clientY}; ${getAngle(event.clientX - width/2, event.clientY - height/2)}`);
}

function click(event) {
    console.log(`x: ${event.clientX} y: ${event.clientY}`);
}

function load() {
    canvas = document.getElementById("canvas");

    body = document.getElementById("body");

    ctx = canvas.getContext("2d");
    ctx.fillStyle = "blue";
    setCanvasSize();

    document.getElementById("conflict_button").addEventListener("click", conflict_press);
    document.getElementById("close_button").addEventListener("click", function(){
        document.getElementById("settings").hidden = true;
    });
    document.getElementById("open_button").addEventListener("click", function(){
        document.getElementById("min_triangles").value = min_triangles;
        document.getElementById("max_triangles").value = max_triangles;
        document.getElementById("min_conflicts").value = min_conflicts;
        document.getElementById("max_conflicts").value = max_conflicts;
        document.getElementById("boards").value = boards;
        document.getElementById("hax").checked = hax;
        document.getElementById("settings").hidden = false;
    });
    document.getElementById("restart_button").addEventListener("click", function(){
        document.getElementById("settings").hidden = true;
        document.getElementById("game_over_screen").hidden = true;
        start();
    });

    document.getElementById("save_close_button").addEventListener("click", updateSettings);

    window.addEventListener("resize", setCanvasSize);
    
    //canvas.addEventListener("click", screenClick);
    //window.addEventListener("click", click);

    start();
}