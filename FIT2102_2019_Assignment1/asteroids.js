"use strict";
function getAttr(element) {
    const x = element.getAttribute("transform").split(" ")[0].match(/-?\d+\.?\d*/g).map(parseFloat)[0], y = element.getAttribute("transform").split(" ")[1].match(/-?\d+\.?\d*/g).map(parseFloat)[0], angle = element.getAttribute("transform").split(" ")[2].match(/-?\d+/g).map(parseFloat)[0];
    return { x, y, angle };
}
function getSpeed(element) {
    return Number(element.getAttribute("speed"));
}
function wrapAround(x, y, angle) {
    const baseAngle = Math.abs(angle) % 360;
    if ([0, 90, 180, 270].includes(baseAngle)) {
        const newX = (x <= -20) ? 600 : (x > 620 ? 0 : x);
        const newY = (y <= -20) ? 600 : (y > 620 ? 0 : y);
        return { newX, newY };
    }
    else {
        const newPostion = (x <= -20) ? { newX: 600, newY: Math.abs(600 - y) }
            : (x > 620) ? { newX: 0, newY: Math.abs(600 - y) }
                : ((y <= -20) ? { newX: Math.abs(600 - x), newY: 600 }
                    : (y > 620) ? { newX: Math.abs(600 - x), newY: 0 } : { newX: x, newY: y });
        return newPostion;
    }
}
function randomOffset() {
    const xOffest = (Math.random() > 0.5 ? 1 * Math.random() : -1 * Math.random()), yOffset = (Math.random() > 0.5 ? 1 * Math.random() : -1 * Math.random());
    return (xOffest == 0 && yOffset == 0) ? randomOffset() : { x: xOffest, y: yOffset };
}
function moveElements(elemPosition, elemOffset) {
    const newElemX = elemPosition.x + elemOffset.x, newElemY = elemPosition.y + elemOffset.y;
    return wrapAround(newElemX, newElemY, elemPosition.angle);
}
function detectCollision(elementList, object, range) {
    const elementXY = elementList.map(element => getAttr(element)), objPosition = getAttr(object);
    const gotCollision = elemPosition => objPosition => { return (Math.abs(objPosition.x - elemPosition.x) <= range && Math.abs(objPosition.y - elemPosition.y) <= range) ? true : false; };
    return Observable.fromArray(elementXY)
        .map(elementPosition => gotCollision(elementPosition)(objPosition))
        .scan(false, (x, y) => x || y)
        .filter(gotCollision => gotCollision == true);
}
function detectCollisionWithShip(elemList, ship, range) {
    return detectCollision(elemList, ship, range);
}
function gameOver(ship) {
    const currentLives = Number(ship.getAttribute("lives"));
    return currentLives == 0;
}
function gameOverObservable(ship) {
    return Observable.interval(1).filter(() => gameOver(ship));
}
function spaceship() {
    const svg = document.getElementById("canvas"), Rkeydown = Observable.fromEvent(document, "keydown").filter(e => e.keyCode == 39), Lkeydown = Observable.fromEvent(document, "keydown").filter(e => e.keyCode == 37), Ukeydown = Observable.fromEvent(document, "keydown").filter(e => e.keyCode == 38), Ukeyup = Observable.fromEvent(document, "keyup").filter(e => e.keyCode == 38), spacekeydown = Observable.fromEvent(document, "keydown").filter(e => e.keyCode == 32), spacekeyup = Observable.fromEvent(document, "keyup").filter(e => e.keyCode == 32);
    let g = new Elem(svg, 'g')
        .attr("id", "shipG")
        .attr("transform", "translate(300 300) rotate(170)")
        .attr("speed", "0");
    let ship = new Elem(svg, 'polygon', g.elem)
        .attr("id", "ship")
        .attr("points", "-15,20 15,20 0,-20")
        .attr("style", "fill:lime;stroke:purple;stroke-width:1")
        .attr("shooting", "false")
        .attr("score", "0")
        .attr("lives", "3");
    let bulletg = new Elem(svg, "g")
        .attr("id", "bulletG");
    function calculateMove(elemPosition, speed) {
        const elemX = elemPosition.x + (speed * Math.sin(elemPosition.angle * Math.PI / 180)), elemY = elemPosition.y - (speed * Math.cos(elemPosition.angle * Math.PI / 180));
        return { elemX, elemY };
    }
    function shipRotate(shipPosition, rotation) {
        const { x: shipX, y: shipY } = shipPosition, shipAngle = shipPosition.angle + rotation;
        return { shipX, shipY, shipAngle };
    }
    function shipMove(shipPosition, shipSpeed) {
        const { elemX: shipX, elemY: shipY } = calculateMove(shipPosition, shipSpeed), translation = wrapAround(shipX, shipY, shipPosition.angle);
        return { translation, shipAngle: shipPosition.angle, shipSpeed };
    }
    function accelerate(shipPosition, speed) {
        const shipSpeed = speed + 1 > 10 ? speed : speed + 1;
        return shipMove(shipPosition, shipSpeed);
    }
    function decelerate(shipPosition, speed) {
        const shipSpeed = speed - 1 == 0 ? speed : speed - 1;
        return shipMove(shipPosition, shipSpeed);
    }
    function createBullet(head, shipPosition) {
        const bulletCX = Number(head[0]), bulletCY = Number(head[1]) - 15, { x: shipX, y: shipY, angle: shipAngle } = shipPosition;
        return { bulletCX, bulletCY, shipX, shipY, shipAngle };
    }
    function bulletMove(bullet, bulletPosition) {
        const { elemX: bulletX, elemY: bulletY } = calculateMove(bulletPosition, 5);
        return { bullet, bulletX, bulletY, bulletAngle: bulletPosition.angle };
    }
    Rkeydown.takeUntil(gameOverObservable(ship.elem))
        .map(() => getAttr(g.elem))
        .map(shipPosition => shipRotate(shipPosition, 10))
        .subscribe(({ shipX, shipY, shipAngle }) => g.attr("transform", `translate(` + shipX + ` ` + shipY + `) rotate(` + shipAngle + `)`));
    Lkeydown.takeUntil(gameOverObservable(ship.elem))
        .map(() => getAttr(g.elem))
        .map(shipPosition => shipRotate(shipPosition, -10))
        .subscribe(({ shipX, shipY, shipAngle }) => g.attr("transform", `translate(` + shipX + ` ` + shipY + `) rotate(` + shipAngle + `)`));
    Ukeydown.takeUntil(gameOverObservable(ship.elem))
        .map(() => ({ shipPosition: getAttr(g.elem), speed: getSpeed(g.elem) }))
        .map(({ shipPosition, speed }) => accelerate(shipPosition, speed))
        .subscribe(({ translation, shipAngle, shipSpeed }) => {
        g.attr("speed", `` + shipSpeed + ``);
        g.attr("transform", `translate(` + translation.newX + ` ` + translation.newY + `) rotate(` + shipAngle + `)`);
    });
    Ukeyup.takeUntil(gameOverObservable(ship.elem))
        .flatMap(() => Observable.interval(10).takeUntil(Ukeydown)
        .map(() => ({
        shipPosition: getAttr(g.elem),
        speed: getSpeed(g.elem)
    }))
        .map(({ shipPosition, speed }) => decelerate(shipPosition, speed)))
        .subscribe(({ translation, shipAngle, shipSpeed }) => {
        g.attr("speed", `` + shipSpeed + ``);
        g.attr("transform", `translate(` + translation.newX + ` ` + translation.newY + `) rotate(` + shipAngle + `)`);
    });
    spacekeydown.takeUntil(gameOverObservable(ship.elem))
        .map(() => ship.elem.getAttribute("shooting"))
        .filter(shooting => shooting == "false")
        .map(() => ship.attr("shooting", "true"))
        .map(() => ({
        head: ship.elem.getAttribute("points").split(" ")[2].split(","),
        shipPosition: getAttr(g.elem)
    }))
        .map(({ head, shipPosition }) => createBullet(head, shipPosition))
        .map(({ bulletCX, bulletCY, shipX, shipY, shipAngle }) => {
        return new Elem(svg, "rect", bulletg.elem)
            .attr("id", "bullet")
            .attr("height", "10").attr("width", "3").attr("style", "fill:white")
            .attr("x", `` + bulletCX + ``).attr("y", `` + bulletCY + ``)
            .attr("transform", `translate(` + shipX + ` ` + shipY + `) rotate(` + shipAngle + `)`);
    })
        .flatMap((bullet) => Observable.interval(15)
        .takeUntil(Observable.interval(2500).map(() => bullet.elem.remove()))
        .map(() => getAttr(bullet.elem))
        .map(bulletPosition => bulletMove(bullet, bulletPosition)))
        .subscribe(({ bullet, bulletX, bulletY, bulletAngle }) => {
        bullet.attr("transform", `translate(` + bulletX + ` ` + bulletY + `) rotate(` + bulletAngle + `)`);
    });
    spacekeyup.takeUntil(gameOverObservable(ship.elem)).subscribe(() => ship.attr("shooting", "false"));
}
function asteroids() {
    const svg = document.getElementById("canvas"), ship = document.getElementById("ship");
    let asteroidg = new Elem(svg, 'g')
        .attr("id", "asteroidG");
    function asteroidDestroyed(asteroid) {
        const rx = asteroid.elem.getAttribute("rx"), ry = asteroid.elem.getAttribute("ry");
        return (rx == "0" && ry == "0");
    }
    function smallAstDestroyed(smallAst) {
        const r = smallAst.elem.getAttribute("r");
        return r == "0";
    }
    function shipDies(ship) {
        return ship.style.display == "none";
    }
    function asteroidMovement(asteroid, astID, astOffset, ship) {
        const destroyedChecker = (astID == "asteroid") ? asteroidDestroyed : smallAstDestroyed;
        return Observable.interval(25)
            .takeUntil(Observable.interval(1).filter(() => destroyedChecker(asteroid) || gameOver(ship) || shipDies(ship)))
            .map(() => getAttr(asteroid.elem))
            .map(astPosition => ({
            asteroid,
            astTranslation: moveElements(astPosition, astOffset)
        }));
    }
    function detectCollisionWithBullet(bulletList, asteroid, range) {
        return detectCollision(bulletList, asteroid, range);
    }
    function deductLife(currentLives) {
        const remainingLives = currentLives - 1;
        return remainingLives;
    }
    function gameOverChecking(remainingLives, ship, shipg, asteroidList, bulletList) {
        if (remainingLives == 0) {
            document.getElementById("gameover").innerHTML = "GAME OVER";
        }
        else {
            ship.style.display = "none";
            asteroidList.map(asteroid => asteroid.remove());
            if (bulletList.length != 0) {
                bulletList.map(bullet => bullet.remove());
            }
            Observable.interval(450).takeUntil(Observable.interval(10).filter(() => ship.style.display == "block")).subscribe(() => {
                shipg.setAttribute("transform", "translate(300 300) rotate(170)");
                ship.style.display = "block";
            });
        }
    }
    function smallAsteroids(smallAst1, smallAst2) {
        Observable.fromArray([smallAst1, smallAst2])
            .takeUntil(gameOverObservable(ship))
            .map(smallAst => ({ smallAst, astOffset: randomOffset() }))
            .subscribe(({ smallAst, astOffset }) => {
            const ship = document.getElementById("ship"), smallAstID = smallAst.elem.getAttribute("id");
            asteroidMovement(smallAst, smallAstID, astOffset, ship).subscribe(({ astTranslation }) => {
                smallAst.attr("transform", `translate(` + astTranslation.newX + ` ` + astTranslation.newY + `) rotate(180)`);
                const ship = document.getElementById("ship"), shipg = document.getElementById("shipG"), bulletList = Array.from(document.getElementById("bulletG").children), asteroidList = Array.from(document.getElementById("asteroidG").children);
                detectCollisionWithShip([smallAst.elem], shipg, 28).subscribe(() => {
                    const currentLives = Number(ship.getAttribute("lives")), remainingLives = deductLife(currentLives);
                    ship.setAttribute("lives", `` + remainingLives + ``);
                    document.getElementById("lives").innerHTML = `Lives: ` + remainingLives + ``;
                    gameOverChecking(remainingLives, ship, shipg, asteroidList, bulletList);
                });
                detectCollisionWithBullet(bulletList, smallAst.elem, 25).subscribe(() => {
                    smallAst.attr("r", "0");
                    smallAst.elem.remove();
                    const ship = document.getElementById("ship"), initialScore = Number(ship.getAttribute("score")), newScore = initialScore + 20;
                    ship.setAttribute("score", `` + newScore + ``);
                    document.getElementById("score").innerHTML = `Score: ` + newScore + ``;
                });
            });
        });
    }
    Observable.interval(3000)
        .takeUntil(gameOverObservable(ship))
        .map(() => ({
        astX: Math.random() * 600,
        astY: Math.random() * 600
    }))
        .map(({ astX, astY }) => {
        return new Elem(svg, "ellipse", asteroidg.elem)
            .attr("id", "asteroid")
            .attr("style", "cx:0; cy:0; rx:40; ry: 20; stroke:Tomato; stroke-width:2; fill:transparent")
            .attr("transform", `translate(` + astX + ` ` + astY + `) rotate(180)`)
            .attr("rx", "40")
            .attr("ry", "20");
    })
        .map(asteroid => ({ asteroid, astOffset: randomOffset() }))
        .flatMap(({ asteroid, astOffset }) => {
        const ship = document.getElementById("ship"), astID = asteroid.elem.getAttribute("id");
        return asteroidMovement(asteroid, astID, astOffset, ship);
    })
        .subscribe(({ asteroid, astTranslation }) => {
        asteroid.attr("transform", `translate(` + astTranslation.newX + ` ` + astTranslation.newY + `) rotate(180)`);
        const ship = document.getElementById("ship"), shipg = document.getElementById("shipG"), bulletList = Array.from(document.getElementById("bulletG").children), asteroidList = Array.from(document.getElementById("asteroidG").children);
        detectCollisionWithShip([asteroid.elem], shipg, 30).subscribe(() => {
            const currentLives = Number(ship.getAttribute("lives")), remainingLives = deductLife(currentLives);
            ship.setAttribute("lives", `` + remainingLives + ``);
            document.getElementById("lives").innerHTML = `Lives: ` + remainingLives + ``;
            gameOverChecking(remainingLives, ship, shipg, asteroidList, bulletList);
        });
        detectCollisionWithBullet(bulletList, asteroid.elem, 30).map(() => getAttr(asteroid.elem))
            .map(astPosition => ({
            firstX: astPosition.x - 50,
            firstY: astPosition.y - 40,
            secondX: astPosition.x + 30,
            secondY: astPosition.y + 80
        }))
            .map(({ firstX, firstY, secondX, secondY }) => ({
            smallAst1: new Elem(svg, "circle", asteroidg.elem)
                .attr("id", "smallAst1")
                .attr("style", "cx:0; cy:0; r:20; stroke:Tomato; stroke-width:2; fill:transparent")
                .attr("r", "20")
                .attr("transform", `translate(` + firstX + ` ` + firstY + `) rotate(180)`),
            smallAst2: new Elem(svg, "circle", asteroidg.elem)
                .attr("id", "smallAst2")
                .attr("style", "cx:0; cy:0; r:20; stroke:Tomato; stroke-width:2; fill:transparent")
                .attr("r", "20")
                .attr("transform", `translate(` + secondX + ` ` + secondY + `) rotate(180)`)
        }))
            .subscribe(({ smallAst1, smallAst2 }) => {
            asteroid.attr("style", "cx:0; cy:0; rx:0; ry: 0; stroke:Tomato; stroke-width:2; fill:transparent")
                .attr("rx", "0").attr("ry", "0");
            asteroid.elem.remove();
            smallAsteroids(smallAst1, smallAst2);
        });
    });
}
function monster() {
    const svg = document.getElementById("canvas"), shipg = document.getElementById("shipG"), ship = document.getElementById("ship");
    Observable.interval(20000).takeUntil(gameOverObservable(ship)).subscribe(() => {
        Observable.interval(10000)
            .takeUntil(gameOverObservable(ship))
            .takeUntil(Observable.interval(20000).map(() => document.getElementById("monster").remove()))
            .map(() => ({ monsterX: Math.random() * 600, monsterY: Math.random() * 600 }))
            .map(({ monsterX, monsterY }) => {
            return new Elem(svg, "ellipse")
                .attr("id", "monster")
                .attr("style", "cx:0; cy:0; rx:30; ry:5; fill:grey")
                .attr("transform", `translate(` + monsterX + ` ` + monsterY + `) rotate(90)`);
        })
            .map((monster) => ({ monster, monsterOffset: randomOffset() }))
            .flatMap(({ monster, monsterOffset }) => Observable.interval(0.01).takeUntil(gameOverObservable(ship))
            .map(() => getAttr(monster.elem))
            .map(monsterPosition => ({
            monster,
            monsterTranslation: moveElements(monsterPosition, monsterOffset)
        })))
            .subscribe(({ monster, monsterTranslation }) => {
            monster.attr("transform", `translate(` + monsterTranslation.newX + ` ` + monsterTranslation.newY + `) rotate(90)`);
            detectCollisionWithShip([monster.elem], shipg, 20).subscribe(() => {
                ship.setAttribute("lives", "0");
                document.getElementById("lives").innerHTML = "Lives: 0";
                document.getElementById("gameover").innerHTML = "GAME OVER";
            });
        });
    });
}
if (typeof window != 'undefined')
    window.onload = () => {
        const svg = document.getElementById("canvas"), startgroup = new Elem(svg, "g").attr("id", "start").attr("transform", "translate (-20 100)"), startbutton = new Elem(svg, "rect", startgroup.elem).attr("x", "230").attr("y", "350").attr("style", "fill: lightblue").attr("width", "150").attr("height", "60"), starttext = new Elem(svg, "text", startgroup.elem).attr("x", "280").attr("y", "390").attr("style", "font-size:150%; fill:black;"), welcomeText = document.getElementById("welcome"), instructionText = document.getElementById("instruction"), cautionText = document.getElementById("caution");
        starttext.elem.textContent = "Start";
        welcomeText.textContent = "WELCOME TO ASTEROIDS!\r\n\n";
        instructionText.textContent = "Press LEFT or RIGHT to rotate.\r\n" +
            "Press UP to move forward.\r\n" +
            "SPACEBAR to shoot.\r\n\n";
        cautionText.textContent = "BEWARE: The space is dangerous. Watch out for ENEMIES.\r\n" +
            "They come and go as they wish and are INDESTRUCTIBLE!\r\n" +
            "They can KILL you instantly though.\r\n" +
            "So, AVOID them if you see them!";
        startbutton.observe("mousedown")
            .subscribe(() => {
            startgroup.elem.remove();
            welcomeText.style.display = "none";
            instructionText.style.display = "none";
            cautionText.style.display = "none";
            document.getElementById("gamestart").innerHTML = "GAME START!";
            Observable.interval(1500).subscribe(() => document.getElementById("gamestart").innerHTML = "");
            spaceship();
            asteroids();
            monster();
        });
    };
//# sourceMappingURL=asteroids.js.map