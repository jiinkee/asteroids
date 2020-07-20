// 29274389 Kee Pei Jiin
// Date Created: 30/8/2019
// Date Last Modified: 13/9/2019
// FIT2102 2019 Assignment 1
// https://docs.google.com/document/d/1Gr-M6LTU-tfm4yabqZWJYg-zTjEVqHKKTCvePGCYsUA/edit?usp=sharing

/**
 * This asteroids game requires the player to use arrow keys to control the ship. The ship can rotate, thrust, and decelerate (gliding).
 * The ship can shoot one bullet at one time. When the big asteroids are shot, they will be broken down into smaller asteroids and only
 * smaller asteroids can be destroyed completely. Shooting the big asteroid does not give you score but shooting each small asteroid 
 * will increase the player's score by 20.
 * The ship has 3 lives in total. The game ends when the ship life is 0. Each colision between the ship and asteroid will deduct the ship's lives by one.
 * Besides, after 30 seconds the game started, indestructible monster will appear at random place.
 * Each monster will appear for 10 seconds and disappear. Then, after another 10 seconds, another monster will be created. Shooting bullet
 * to the monster will not harm it, but if the ship collides with it, the ship dies instantly.
 * 
 */


/**
 * Retrieve x & y coordinates, and the angle of element
 * This function is pure because it only depends on the input, which is the element.
 * It does not retrieve the element from the outside scope.
 * It returns the attribute values of the element without modifying the values, hence there is no side effect.
 * 
 * @param element HTML Element or Element such as ship, shipG, asteroidG etc.
 * @return tuple of x-coordinate, y-coordinate and angle of element
 */
function getAttr(element:Element | HTMLElement):{x:number, y:number, angle:number}{
    // use regex to extract the desired values from string in the format of "(translate (x y) rotate (angle))"
    const 
      x:number = element.getAttribute("transform")!.split(" ")[0].match(/-?\d+\.?\d*/g)!.map(parseFloat)[0],
      y:number = element.getAttribute("transform")!.split(" ")[1].match(/-?\d+\.?\d*/g)!.map(parseFloat)[0],
      angle:number = element.getAttribute("transform")!.split(" ")[2].match(/-?\d+/g)!.map(parseFloat)[0];
    return {x, y, angle}
 }

 /**
  * Retrieve the speed attribute of element
  * This is a pure function it only depends on the input, which is the element. It returns the speed of the element without modifying
  * the values. Although it changes the data type of speed, the speed of new data type is not assigned to any variables outside the function
  * scope, hence it does not have any side effect.
  * 
  * @param element HTML Element or Element such as ship, shipG, bulletG, but not applicable to asteroids and monster because they do not have the attribute speed
  * @return number representing the speed of the element
  */
function getSpeed(element:Element | HTMLElement):number{
   // convert the speed attribute from String to number
   return Number(element.getAttribute("speed"));
 }

/**
 * Enable elements such as ship and asteroids to wrap around the edges of the map.
 * 
 * This function is pure because it depends only on its input parameters, which are the x & y coordinates of the element, and the 
 * function does not change the value of the input parameter. The new x & y coordinates of the element are stored in new constants
 * instead of being assigned back to the input parameter, hence side effect is contained and the function is pure.
 * 
 * @param x x-coordinate of element
 * @param y y-coordinate of element
 * @param angle angle of element
 * @return a tuple consists of the new x & y coordinates of element after wraping around the edges of the canvas
 */
function wrapAround(x:number, y:number, angle:number):{newX: number, newY: number}{
  const baseAngle = Math.abs(angle) % 360;   // the base angle, angle value in the first cycle

  if ([0,90,180,270].includes(baseAngle)){
    // if the head of the ship is facing at special angles (vertical or horizontal), then the ship will reappear at the direct opposite 
    // of its position before wrapping around
      const newX:number = (x <= -20) ? 600 : (x > 620 ? 0 : x);
      const newY:number = (y <= -20) ? 600 : (y > 620 ? 0 : y);
      return {newX, newY}
  }
  else{
      // since the map is torus topology and the ship head is not facing at a slanting angle,
      // the ship will reappear at the slating opposite of its position before wrapping around
      // e.g. the ship that leaves the canvas from bottom right corner will reappear at the top left corner of canvas
      const newPostion:{newX:number, newY:number} = (x <= -20) ? {newX:600, newY: Math.abs(600-y)} 
                                                    : (x > 620) ? {newX:0, newY: Math.abs(600-y)}
                                                        : ((y <= -20) ? {newX: Math.abs(600-x), newY:600}
                                                            : (y > 620) ? {newX:Math.abs(600-x), newY:0} : {newX:x, newY:y});
      return newPostion;
  }
}

/**
 * Recursive function that set a pair of x & y offsets for each asteroid and monster created.
 * The offset pair generated decides the direction & speed of the asteroid/monster.
 * Since the offset pair values are generated at random, this results in the random & unpredictable movement of asteroid/monster.
 * 
 * This function is impure as it generates random value.
 * However, it is acceptable to have this impure function, because random number is required to randomise the movement of elements.
 */
function randomOffset():({x:number, y:number}){
  const 
    xOffest:number = (Math.random() > 0.5 ? 1*Math.random() : -1*Math.random()),
    yOffset:number = (Math.random() > 0.5 ? 1*Math.random() : -1*Math.random());
  //offset values cannot be 0, otherwise the element will not move (because there is no position offset)
  //hence, need to generate new offset values if any of the values is 0
  return (xOffest == 0 && yOffset == 0) ? randomOffset() : {x: xOffest, y: yOffset}; 
}

/**
 * Calculates the x & y coordinates of the new position of asteroids and monster using the offset values of the element.
 * The new position is used in the movement of the element.
 * 
 * This is a pure function because the return result depends only on the input. Besides, the changes of x & y values are not made 
 * on the input parameters, instead these new values are assigned to new constants. This function also return the return value of 
 * wrapAround(), which is a pure function, without any modification, so this function does not have any side effect.
 * 
 * @param elemPosition the current position of the asteroid/monster
 * @param elemOffset the x & y offset pair of that asteroid/monster
 * @return a tuple consists of x & y coordinates of the new position of the element
 */
function moveElements(elemPosition:{x:number, y:number, angle:number}, elemOffset:{x: number, y:number}):{newX:number, newY:number}{
  const 
    newElemX:number = elemPosition.x + elemOffset.x,
    newElemY:number = elemPosition.y + elemOffset.y;
  // pass into the wrapAround function so that the new position of element is within the canvas
  return wrapAround(newElemX, newElemY, elemPosition.angle); 
}

/**
 * Detect collision between two elements i.e. asteroid with ship & monster with ship & bullet with asteroid
 * The collision is detected by determining the approximity of two elements. This can be obtained by finding the difference between
 * the x & y cooordinates of the two elements. Collision is considered to occur if the difference is smaller than or equal to the 
 * defined range.
 * 
 * This is a pure function because the return value only depends on the input parameters and it does not change their values.
 * It is declared in the global scope because this function is used in all the driver functions i.e. spaceship(), asteroids(), monster()
 * Besides, this function has contained the side effect by returning an Observable that determines if collision has occured, rather than
 * using if..else statement to check the collision occurrence and make changes on the element/object for the collision effect.
 * This function solely detects if collision has occured, and does not make any changes onto the element/object even when collision 
 * has occured.
 * 
 * @param elementList An array that contains element(s) e.g. asteroid and bullets
 * @param object Element that we need to check collision against the element in elementList
 * @param range The approximity value used to detect collision
 * @return an Observable that tells if collision has occured between the two given elements
 */
function detectCollision(elementList:Element[], object:Element, range:number):Observable<boolean>{ 
  const
    elementXY:{x:number, y:number, angle:number}[] = elementList.map(element => getAttr(element)),
    objPosition:{x:number, y:number, angle:number} = getAttr(object);

  // curried arrow function that determines if collision has occured
  const gotCollision:(elemPosition:{x:number, y:number, angle:number}) => (objPosition:{x:number, y:number, angle:number}) => boolean
        = elemPosition => objPosition => {return (Math.abs(objPosition.x - elemPosition.x) <= range && Math.abs(objPosition.y - elemPosition.y) <= range) ? true : false};
  
  return Observable.fromArray(elementXY)
                  .map(elementPosition => gotCollision(elementPosition)(objPosition)) // returns Observables of boolean value
                  .scan(false, (x, y) => x || y) // reduces the boolean values of Observables to one single value
                  .filter(gotCollision => gotCollision == true);
}

/**
 * A helper function that calls the function detectCollision() to detect collision between the given element with the ship element.
 * This function is declared at global scope because it is being used in the asteroids() and monster().
 * It is decided to declare this function so that programmer/reader can differentiate between collision with ship and collision 
 * with bullet more easily (even though the structure of these two codes are the same but calling detectCollision() twice in a 
 * driver function might cause confusion).
 * 
 * It is a pure function as it only passes its parameter to detectCollision(), which is a pure function, and returns the 
 * value returned by detectCollision().
 * Besides, this function has contained the side effect by returning an Observable that determines if collision has occured, rather than
 * using if...else statement to check the collision occurrence and make changes on the element/object for the collision effect.
 * This function solely detects if collision has occured, and does not make any changes onto the element/object even when collision 
 * has occured.
 * 
 * @param elemList An array that contains element(s) e.g. asteroids and monster
 * @param ship the ship element
 * @param range The approximity value used to detect collision. Value varies depending on the type of element.
 * @return an Observable that tells if collision has occured between the two given elements -- from the function detectCollision()
 */
function detectCollisionWithShip(elemList:Element[], ship:Element, range:number):Observable<boolean>{
  return detectCollision(elemList, ship, range)
}

/**
 * Check if the game is over. Game is over when the lives of the ship is zero (No lives left).
 * This function is pure because the return result depends on the input parameter. It only retrieves the attribute value of the input, which is 
 * the ship element and does not modify any attribute vlaue of the ship.
 * 
 * Passing the ship as an argument of this function instead of retrieving the ship element inside this function helps to contain 
 * side effect and make this function pure.
 * 
 * @param ship the ship element
 * @return a boolean value, True if the ship life is 0, False otherwise
 */
function gameOver(ship:Element | HTMLElement):boolean{
    const currentLives:number = Number(ship.getAttribute("lives"));
    return currentLives == 0;
}

/**
 * This observable is created to check if the game is over every 1 ms. 
 * It is put in a function at the global scope because this observable is used in all other observables.
 * It returns True when the game is over and hence trigger .takeUntil() in other observables and stop these observables. 
 * 
 * This function is pure because it only passes its input to gameOver(), which is a pure function, and just returns an Observable.
 * It does not have any side effects.
 * 
 * @param ship the ship element
 * @return an Observable that tells if the game is over
 */
function gameOverObservable(ship:Element | HTMLElement):Observable<number>{
  return Observable.interval(1).filter(() => gameOver(ship));
}

/**
 * Driver function of the ship.
 * This function controls the ship movement as well as the bullet shooting of the ship.
 * The player can control the ship movement using arrow keys and shoot bullet using spacebar.
 * 
 * This function is impure because it has side effects such as changing the attribute of elements and reading values from outside
 * the function scope.
 * However, this is inevitable because for the game to function, we cannot avoid side effects.
 */
function spaceship():void{
   //----Declaration of svg canvas and all the related keyboard event Observables----//
   const 
        svg:HTMLElement = document.getElementById("canvas")!,
        Rkeydown:Observable<KeyboardEvent> = Observable.fromEvent<KeyboardEvent>(document, "keydown").filter(e => e.keyCode == 39),
        Lkeydown:Observable<KeyboardEvent> = Observable.fromEvent<KeyboardEvent>(document, "keydown").filter(e => e.keyCode == 37),
        Ukeydown:Observable<KeyboardEvent> = Observable.fromEvent<KeyboardEvent>(document, "keydown").filter(e => e.keyCode == 38),
        Ukeyup:Observable<KeyboardEvent> = Observable.fromEvent<KeyboardEvent>(document, "keyup").filter(e => e.keyCode == 38),
        spacekeydown:Observable<KeyboardEvent> = Observable.fromEvent<KeyboardEvent>(document, "keydown").filter(e => e.keyCode == 32),
        spacekeyup:Observable<KeyboardEvent> = Observable.fromEvent<KeyboardEvent>(document, "keyup").filter(e => e.keyCode == 32);

    // create spaceship group
    let g:Elem = new Elem(svg,'g')
      .attr("id", "shipG")
      .attr("transform","translate(300 300) rotate(170)")
      .attr("speed", "0")  
  
    // create the ship element
    let ship:Elem = new Elem(svg, 'polygon', g.elem)
          .attr("id", "ship") 
          .attr("points","-15,20 15,20 0,-20")
          .attr("style","fill:lime;stroke:purple;stroke-width:1")
          .attr("shooting","false")
          .attr("score", "0") // score increases by 20 each time the ship shoots a small asteroid
          .attr("lives", "3") // the ship has 3 lives
  
    // create bullet group
    let bulletg:Elem = new Elem(svg, "g")
            .attr("id", "bulletG")

    /**
     * These functions are declared inside the driver function spaceship() instead of the global scope because these functions will only
     * be used by the ship element.
     * By declaring them inside spaceship(), it helps to prevent the other driver functions i.e. asteroids() & monster() from using them
     * and change the values, hence containing the side effects.
     */
    //----Function shared for Ship and Bullet Movement----//
    /**
     * Unlike the asteroids and monster which have random movement, the direction and speed of ship depends on keyboard 
     * events and the direction of bullet depends on the angle of the ship.
     * Hence, the next positon in the movement of ship and bullet needs to be calculated using trigonometry.
     * 
     * This is a pure function because it depends only on the input parameters and it does not change the parameter values directly.
     * Instead, the new x & y coordinates of the element are calculated and stored in new constants to contain the side effect.
     *  
     * @param elemPosition the tuple that consists of the current x & y coordinates and the angle of the element
     * @param speed the speed of the element
     * @return a tuple consists of the next x & y coordinates of the ship or bullet
     */
    function calculateMove(elemPosition:{x:number, y:number, angle:number}, speed:number):{elemX:number, elemY:number}{
      const 
          elemX:number = elemPosition.x + (speed * Math.sin(elemPosition.angle * Math.PI/180)),
          elemY:number = elemPosition.y - (speed * Math.cos(elemPosition.angle * Math.PI/180));
      return {elemX, elemY};

    }

    //----Functions for Ship Movement----//
    /**
     * Calculate the new angle of the ship when the ship rotates. Called when left or right arrow key is pressed.
     * 
     * This function is pure because it depends only on its input parameters. It does not change the ship angle value directly.
     * Instead, the new angle of the ship is calculated and stored in a new constant to contain side effect.
     * 
     * Besides, the function returns the new angle of the ship instead of changing the angle attribute of the ship directly to
     * contain the side effect of this function. It returns the angle value and changes on the ship attribute will be made in Observable.
     * 
     * @param shipPosition the current x & y coordinates and angle of the ship
     * @param rotation the rotation angle of the ship, it is negative if left key is pressed and positive if right key is pressed
     * @return a tuple consists of the original x & y coordinates and the new angle of the ship
     */
    function shipRotate(shipPosition:{x:number, y:number, angle:number}, rotation:number):{shipX:number, shipY:number, shipAngle:number}{
        const 
            {x:shipX, y:shipY}:{x:number, y:number} = shipPosition,
            shipAngle:number = shipPosition.angle + rotation;
        return {shipX, shipY, shipAngle}
    }

    /**
     * Determines the next x & y coordinates of the ship while the ship is moving by using the functions calculateMove() and wrapAround().
     * If the ship is moving, the x & y coordinates of the ship will definitely change. Hence, for every ship movement, its new position
     * needs to be determined.
     * 
     * This is a pure function because it depends only on the input parameter values and does not change it.
     * Any changes to the value of argument are stored in new constants instead of assigning them back to the input parameter.
     * And since calculateMove() and wrapAround() are pure functions, this function does not have any side effect, and thus it is pure.
     * 
     * @param shipPosition the current x & y coordinates and the angle of the ship
     * @param shipSpeed the speed of the ship
     * @return a tuple consists of the new x & y coordinates of the ship, its original angle and speed
     */
    function shipMove(shipPosition:{x:number, y:number, angle:number}, shipSpeed:number):{translation:{newX:number, newY:number}, shipAngle:number, shipSpeed:number}{
      const 
        {elemX: shipX, elemY: shipY}:{elemX:number, elemY:number} = calculateMove(shipPosition, shipSpeed),
        translation:{newX:number, newY:number} = wrapAround(shipX, shipY, shipPosition.angle);
      return {translation, shipAngle: shipPosition.angle, shipSpeed} 
    }

    /**
     * Increases the speed of the ship when the up arrow key is pressed to create the thrusting effect.
     * To prevent the ship from moving too fast, the spped of the ship is limited up till 10 only.
     * After increases the speed, the x & y coordinates of the ship will surely change.
     * The new x & y coordinates of the ship is determined by using the function shipMove().
     * 
     * The function returns the new position of the ship instead of changing the position attribute of the ship directly.
     * It returns the position value and changes on the ship attribute will be made in Observable.
     * Besides, the function it calls, shipMove() is a pure function, so this function does not have any side effect.
     *  
     * @param shipPosition the current x & y coordinates and the angle of the ship
     * @param speed the current speed of the ship
     * @return a tuple consists of the new x & y coordinates of the ship, its original angle and speed
     */
    function accelerate(shipPosition:{x:number, y:number, angle:number}, speed:number):{translation:{newX:number, newY:number}, shipAngle:number, shipSpeed:number}{
        const shipSpeed:number = speed + 1 > 10? speed: speed + 1;  // set the maximum speed of ship at 10
        return shipMove(shipPosition, shipSpeed);
    }

    /**
     * Decreases the speed of the ship when the up arrow key is being released. This will result in the ship gliding effect.
     * After decreases the speed, the x & y coordinates of the ship will surely change.
     * The new x & y coordinates of the ship is determined by using the function shipMove().
     * 
     * The function returns the new position of the ship instead of changing the position attribute of the ship directly.
     * It returns the position value and changes on the ship attribute will be made in Observable.
     * Besides, the function it calls, shipMove() is a pure function, so this function does not contain any side effect.
     * 
     * @param shipPosition the current x & y coordinates and the angle of the ship
     * @param speed the current speed of the ship
     * @return a tuple consists of the new x & y coordinates of the ship, its original angle and speed
     */
    function decelerate(shipPosition:{x:number, y:number, angle:number}, speed:number):{translation:{newX:number, newY:number}, shipAngle:number, shipSpeed:number}{
        const shipSpeed:number = speed - 1 == 0? speed: speed - 1;
        return shipMove(shipPosition, shipSpeed);
    }


    //----Function for Bullet Creation and Movement----//
    /**
     * Determines the position of the new bullet generated.
     * The bullet should appear at the front of the ship head. Therefore, the initial x & y coordiantes of the head of the ship is determined.
     * Since the ship has probably been moving before it shoots the bullet, the position of the head has changed too.
     * This is the reason why this function not only returns the initial x & y coordinates of where the bullet should be, but also the
     * x & y coordinates and the angle of the ship so that the bullet can transform accordingly and moves to right in front of 
     * where the ship head is now.
     * 
     * This function is pure because it only depends on its input parameters. Any changes of the input value are not done on the 
     * input parameter directly, instead, the new value is being stored in a new constant. 
     * 
     * Besides, the function returns the new position of the bullet instead of changing the position attribute of the bullet directly.
     * It returns the position value and changes on the bullet attribute will be made in Observable. 
     * This helps to contain the side effect of this function as well.
     * 
     * @param head the head of the ship
     * @param shipPosition the x & y coordinates and the angle of the ship
     * @return a tuple consists of the initial x & y coordinates of the bullet and the translation needs to be done to the bullet
     *         i.e. the x & y coordinates of ship and its angle
     */
    function createBullet(head:string[], shipPosition:{x:number, y:number, angle:number}):{bulletCX:number, bulletCY:number, shipX:number, shipY:number, shipAngle:number}{
        const
          bulletCX:number = Number(head[0]),     // bulletCX and bulletCY are the centre of the bullet (rectangle), right in front of the ship head
          bulletCY:number = Number(head[1]) - 15,
          {x: shipX, y: shipY, angle: shipAngle}:{x:number, y:number, angle:number} = shipPosition;  // transformation of the ship position, if bullet transform accordingly
                                                                  // then the bullet will be right in front of the current position of ship head
        return {bulletCX, bulletCY, shipX, shipY, shipAngle}
    
    }

    /**
     * Determines the next position of the bullet while it is moving.
     * The x & y coordinates of bullet definitely will change when it moves, hence for every move, the new position of the bullet needs
     * to be determined.
     * The new x & y coordinates of the bullet can be determined using the function calculateMove().
     * 
     * Besides, the function returns the new position of the bullet instead of changing the position attribute of the bullet directly.
     * It returns the position value and changes on the ship attribute will be made in Observable.
     * This helps to contain the side effect of this function as well.
     * 
     * @param bullet the bullet element that has been generated
     * @param bulletPosition the current x & y coordinates and the current angle of the bullet
     * @return a tuple consists of the bullet element, the new x & y coordinates of the bullet and its angle
     */
    function bulletMove(bullet:Elem, bulletPosition:{x:number, y:number, angle:number}):{bullet:Elem, bulletX:number, bulletY:number, bulletAngle:number}{ 
        const {elemX: bulletX, elemY:bulletY}:{elemX:number, elemY:number} = calculateMove(bulletPosition, 5);
        return {bullet, bulletX, bulletY, bulletAngle: bulletPosition.angle};
    }


    //----Observe Keydown Events to rotate/ accelerates the ship as well as shooting bullets----//
    /**
     * All the Observables have gameOverObservable(ship.elem) in takeUntil() so that these Observables can stop when the lives of the
     * ship become zero and the game is over. 
     */

    // press right arrow key -- rotate clockwise
    Rkeydown.takeUntil(gameOverObservable(ship.elem))
            .map(() => getAttr(g.elem))
            .map(shipPosition => shipRotate(shipPosition, 10))
            .subscribe(({shipX, shipY, shipAngle}) => g.attr("transform", `translate(`+shipX+` `+shipY+`) rotate(`+shipAngle+`)`))

    
    // press left arrow key -- rotate anticlockwise
    Lkeydown.takeUntil(gameOverObservable(ship.elem))
            .map(() => getAttr(g.elem))
            .map(shipPosition => shipRotate(shipPosition, -10))
            .subscribe(({shipX, shipY, shipAngle}) => g.attr("transform", `translate(`+shipX+` `+shipY+`) rotate(`+shipAngle+`)`))

    // press up arrow key -- thrust, accelerate forward in the direction of the head of ship
    Ukeydown.takeUntil(gameOverObservable(ship.elem))
            .map(() => ( {shipPosition: getAttr(g.elem), speed: getSpeed(g.elem)} ))
            .map(({shipPosition, speed}) => accelerate(shipPosition, speed))
            .subscribe(({translation, shipAngle, shipSpeed}) => {
                  g.attr("speed", ``+shipSpeed+``);
                  g.attr("transform", `translate(`+translation.newX+` `+translation.newY+`) rotate(`+shipAngle+`)`);
            })
      
    // until next keydown, the ship will continue gliding at speed = 1
    Ukeyup.takeUntil(gameOverObservable(ship.elem))
          .flatMap(() => Observable.interval(10).takeUntil(Ukeydown)
                                                .map(() => ({
                                                    shipPosition: getAttr(g.elem),
                                                    speed: getSpeed(g.elem)
                                                }))
                                                .map(({shipPosition, speed}) => decelerate(shipPosition, speed)))
                  
          .subscribe(({translation, shipAngle, shipSpeed}) => {
              g.attr("speed", ``+shipSpeed+``);
              g.attr("transform", `translate(`+translation.newX+` `+translation.newY+`) rotate(`+shipAngle+`)`);
      })
    
    
    // shoot bullet when the spacebar is pressed
    // the Observable has been set to fire only once for each keypress, hence only one bullet will be shoot for each press of spacebar
    spacekeydown.takeUntil(gameOverObservable(ship.elem))
                .map(() => ship.elem.getAttribute("shooting"))
                .filter(shooting => shooting == "false")
                .map(() => ship.attr("shooting", "true"))
                .map(() => ({
                    head: ship.elem.getAttribute("points")!.split(" ")[2].split(","),
                    shipPosition: getAttr(g.elem)
                }))
                .map(({head, shipPosition}) => createBullet(head, shipPosition))
                .map(({bulletCX, bulletCY, shipX, shipY, shipAngle}) => {
                    // create new bullet
                    return new Elem(svg, "rect", bulletg.elem)
                          .attr("id", "bullet")
                          .attr("height","10").attr("width", "3").attr("style", "fill:white")
                          .attr("x",``+bulletCX+``).attr("y", ``+bulletCY+``)
                          .attr("transform", `translate(`+shipX+` `+shipY+`) rotate(`+shipAngle+`)`);
                })
                // move bullet
                .flatMap((bullet: Elem) => Observable.interval(15)
                                                      .takeUntil(Observable.interval(2500).map(() => bullet.elem.remove())) // remove the bullet generated after 2.5s (the bullet will be out of the canvas area by that time)
                                                      .map(() => getAttr(bullet.elem))
                                                      .map(bulletPosition => bulletMove(bullet, bulletPosition)))

                .subscribe(({bullet, bulletX, bulletY, bulletAngle}) => {
                    bullet.attr("transform", `translate(`+bulletX+` `+bulletY+`) rotate(`+bulletAngle+`)`);
                })

    spacekeyup.takeUntil(gameOverObservable(ship.elem)).subscribe(() => ship.attr("shooting", "false"))

}



/**
 * Driver function of the big and small asteroids.
 * This function generates a big asteroid every 3 seconds. The initial position of the big asteroid is randomised but the initial position
 * of the small asteroids depend on the position of the big asteroid. The movement of both the big and small asteroids are randomised.
 * If the big asteroid is shot, the big asteroid will be broken down into small asteroids.
 * If the ship collides with any asteroid, its life will be deducted by one, when the life turns zero, the game is over.
 * 
 * This function is impure because it has side effects such as changing the attribute of elements and reading values from outside
 * the function scope.
 * However, this is inevitable because for the game to function, we cannot avoid side effects.
 */
function asteroids():void{
    //----Declaration of svg canvas and the ship element----//
    const 
       svg:HTMLElement = document.getElementById("canvas")!,
       ship:HTMLElement = document.getElementById("ship")!;

    // create asteroid group
    let asteroidg:Elem = new Elem(svg,'g')
        .attr("id", "asteroidG")

    
    /**
     * These functions are declared inside the driver function asteroids() instead of the global scope because these functions will only
     * be used by the asteroid element.
     * By declaring them inside asteroids(), it helps to prevent the other driver functions i.e. spaceship() & monster() from using them
     * and change the values, hence containing the side effects.
     */

    //----used in Observable.takeUntil()----//
    //----some conditions that should make the Observables inside asteroids() stop----//
    /**
     * This function is used for big asteroids only.
     * Determines if a big asteroid has been broken down into smaller pieces. The big asteroid will be broken down when it is shot.
     * When the big asteroid is shot, its rx and ry values will be set to 0.
     * 
     * This function is pure because it depends only on its input parameter, it does not access the big asteroid element from the 
     * outside scope. Besides, it only retrieves the attribute values of the big asteroid and does not change the attribute values.
     * Hence, this function does not contain any side effects and thus this function is pure.
     * 
     * @param asteroid the big asteroid element
     * @return a boolean value that indicates whether the big asteroid has been destroyed
     */
    function asteroidDestroyed(asteroid:Elem):boolean{
      const 
        rx:string = asteroid.elem.getAttribute("rx")!,
        ry:string = asteroid.elem.getAttribute("ry")!;
      return (rx == "0" && ry == "0")
    }
  
    /**
     * This function is used for small asteroids only.
     * Determines if a small asteroid has been destroyed. Small asteroid will be destroyed if it is shot.
     * When the small asteroid is shot, its r vallue will be set to 0.
     * 
     * This function is pure because it depends only on its input parameter, it does not access the small asteroid element from the 
     * outside scope. Besides, it only retrieves the attribute value of the small asteroid and does not change the attribute value.
     * Hence, this function does not contain any side effects and thus this function is pure.
     * 
     * @param smallAst the small asteroid element
     * @return a boolean value that indicates whether the small asteroid has been destroyed
     */
    function smallAstDestroyed(smallAst:Elem):boolean{
      const r:string = smallAst.elem.getAttribute("r")!;
      return r =="0";
    }
  
    /**
     * Determines if the ship has been destroyed. The ship will be destroyed when it collides with asteroids (big or small).
     * If the ship dies and the game is not over, the ship will be hidden from the document.
     * 
     * This function is pure because it depends only on its input parameter, it does not access the ship element from the 
     * outside scope. Besides, it only retrieves the attribute value of the ship and makes a comparison using this value.
     * Hence, this function does not contain any side effects and thus this function is pure.
     * 
     */
    function shipDies(ship:HTMLElement):boolean{
      return ship.style.display == "none";
    }

    //----Functions that move the asteroids----//
    /**
     * Function shared by both big and small asteroids.
     * It returns an Observable which is used by both big and small asteroids to move these asteroids.
     * 
     * This function is a pure function because it only returns the observable that has the new x & y coordinates of the asteroid 
     * instead of changing the asteroid attribute directly, thus it helps to contain the side effect. Besides, the functions called 
     * inside this function are all pure functions, so this function is not infected by any impurities and thus it does not result in
     * any side effect. 
     * 
     * @param asteroid the asteroid element that is moving
     * @param astID the ID of the moving asteroid
     * @param astOffset the unique x & y offsets pair of that moving asteroid (each asteroid has different offset, so that the asteroid movement is randomised)
     * @param ship the ship element, used to check if any collision has occured and if yes, this Observable will stop observing and hence 
     *             asteroids will stop moving either when the ship collides with asteroid or when the asteroid is shot.
     * @return an Observable that returns the asteroid itself and its translation for the next move
     */
    function asteroidMovement(asteroid:Elem, astID:string, astOffset:{x:number, y:number}, ship:HTMLElement):Observable<{asteroid:Elem, astTranslation:{newX:number, newY:number}}>{
      // stop when the ship collides with asteroid (game over) or when the asteroid disappear or when the ship dies (but not game over)
      // check ID to decide which destroyed function to use

      // when big asteroid is shot, its rx and ry change; when small asteroid is shot, its r changes
      // since the attribute changes for these two types of asteroids are different, to check if an asteroid is destroyed, two functions are needed
      // the checking function is decided using the ID of the asteroid
      const destroyedChecker = (astID == "asteroid") ? asteroidDestroyed : smallAstDestroyed;
      
      return Observable.interval(25)
                      .takeUntil(Observable.interval(1).filter(() => destroyedChecker(asteroid) || gameOver(ship) || shipDies(ship)))
                      .map(() => getAttr(asteroid.elem))    // get the initial position of asteroid 
                      .map(astPosition => ({
                          asteroid,
                          astTranslation: moveElements(astPosition, astOffset) // the new position of asteroid
                      }))
    }

    //----Functions that detect collisions and check for game over----//
    /**
     * This function is shared by both big and small asteroids as well.
     * A helper function that calls the function detectCollision() to detect collision between asteroid and all the bullets.
     * It is decided to declare this function so that programmer/reader can differentiate between collision with ship and collision 
     * with bullet more easily.
     * 
     * This function is pure because it only passes its input to detectCollision() and return the Observable returned by detectCollision()
     * without making any changes to the input parameters and the outer environment.
     * 
     * Besides, this function has contained the side effect by returning an Observable that determines if collision has occured, rather than
     * using if...else statement to check the collision occurrence and make changes on the element/object for the collision effect.
     * This function solely detects if collision has occured, and does not make any changes onto the element/object even when collision 
     * has occured.
     * 
     * @param bulletList the list of the all the current generated bullets
     * @param asteroid the asteroid element
     * @param range the approximity range that is used to detect collision
     * @return an Observable that tells if collision has occured between the two given elements -- from the function detectCollision()
     */
    function detectCollisionWithBullet(bulletList:Element[], asteroid:Element, range:number){
      return detectCollision(bulletList, asteroid, range);
    }

    /**
     * Deduct one life from the ship each time it collides with an asteroid.
     * 
     * This is a pure funciton because it depends only on its input, and it does not change the value of its input (currentLives) directly.
     * Instead, the remaining lives that the ship has is stored in a new constant and this constant is returned. Therefore, this function does
     * not have any side effect.
     * 
     * @param currentLives the current lives that the ship has
     * @return the remaining lives of the ship
     */
    function deductLife(currentLives:number):number{
        const remainingLives:number = currentLives - 1;
        return remainingLives;
    }

    /**
     * This function is impure because it contains side effect such as removing elements from the document, writing text on the document and changing the 
     * attribute value of element.
     * But this impure function is inevitable because to update the player with the "GAME OVER" message or to make the ship respawn, these actions
     * will definitely result in side effects. And since the codes for game over and ship respawn are used for both big and small asteroids, 
     * it is decided to refactor the code and put them into a function.
     * 
     * Alhtough the function is impure, some of the side effects are contained, for example, the update on the lives of the ship element 
     * and on screen is not done in this function.
     * This function just checks whether the game is over and carries out the corresponding effects.
     * 
     * @param remainingLives the remaining lives the ship has
     * @param ship the ship element
     * @param shipg the ship element group
     * @param asteroidList the element list of all current asteroids
     * @param bulletList the element list of all current bullets
     */
    function gameOverChecking(remainingLives:number, ship:HTMLElement, shipg:HTMLElement, asteroidList:Element[], bulletList:Element[]):void{
        if (remainingLives == 0){  // no lives remaining, GAME OVER
            document.getElementById("gameover")!.innerHTML = "GAME OVER" // Display the Game Over on canvas
        }
        else{ // there are still some lives remained, the game does not end
            ship.style.display = "none";  // hide the ship, ship dies
            asteroidList.map(asteroid => asteroid.remove())  // clear all asteroids
            if (bulletList.length != 0){
                bulletList.map(bullet => bullet.remove()) // clear all bullets (if any)
            }
                    
            // ship respawn after a 450ms delay
            Observable.interval(450).takeUntil(Observable.interval(10).filter(() => ship.style.display == "block")).subscribe(() =>{
              shipg.setAttribute("transform","translate(300 300) rotate(170)") // set the ship back to origin
              ship.style.display = "block"; // show the ship, ship lives again :>
            })
        }       
      }

    //----SMALL ASTEROIDS----//
    /**
     * Big asteroid will break down into two small asteroids when it is shot.
     * This function contains the Observable that moves the two small asteroids, detect collision between the small asteroid and ship as well as bullet.
     * It is also declared inside the driver function asteroids() instead of the global scope because the small asteroids share some functions with the big
     * asteroids and these functions are declared inside the scope of asteroids() as well.
     * 
     * Since the attribute values of small asteroid are changed inside this function, this function is impure.
     * However, it is acceptable for it to be impure because to move small asteroids and deduct the ship life when collision occurs cannot be done without
     * side effect.
     * 
     * @param smallAst1 the first small asteriod 
     * @param smallAst2 the second small asteroid
     */
    function smallAsteroids(smallAst1:Elem, smallAst2:Elem):void{
      Observable.fromArray([smallAst1, smallAst2])
                .takeUntil(gameOverObservable(ship))
                .map(smallAst => ({smallAst, astOffset:randomOffset()})) // generate x & y offset values for each small asteroid so that each small asteroid moves at random directions

                .subscribe(({smallAst, astOffset}) => {
                      const ship = document.getElementById("ship")!,
                            smallAstID = smallAst.elem.getAttribute("id")!;
                      asteroidMovement(smallAst, smallAstID, astOffset, ship).subscribe(({astTranslation}) => {
                          // move the small asteroid
                          smallAst.attr("transform", `translate(`+astTranslation.newX+` `+astTranslation.newY+`) rotate(180)`);
                          
                          //declare the constants here to take the real-time data as the Observable executes
                          const
                            ship:HTMLElement = document.getElementById("ship")!,
                            shipg:HTMLElement = document.getElementById("shipG")!,
                            bulletList:Element[] = Array.from(document.getElementById("bulletG")!.children),
                            asteroidList:Element[] = Array.from(document.getElementById("asteroidG")!.children);

                          // detects collision of each small asteroid with the ship, GAME OVER
                          detectCollisionWithShip([smallAst.elem], shipg, 28).subscribe(() => {
                                const 
                                    currentLives:number = Number(ship.getAttribute("lives")),
                                    remainingLives:number = deductLife(currentLives);  // one life is deducted each time te ship collides with asteroid

                                ship.setAttribute("lives", ``+remainingLives+``); // update the remaining lives of ships
                                document.getElementById("lives")!.innerHTML = `Lives: `+remainingLives+``; // update the remaining lives on screen
          
                                gameOverChecking(remainingLives, ship, shipg, asteroidList, bulletList); // check if the game is over
                          });
                            

                          // detects collision between each small asteroid and all available bullets
                          detectCollisionWithBullet(bulletList, smallAst.elem, 25).subscribe(() => {
                                  smallAst.attr("r", "0");
                                  smallAst.elem.remove();  // successfully shoot the small asteroid, destroy that small asteroid
                                  
                                  const 
                                    ship:HTMLElement = document.getElementById("ship")!,
                                    initialScore:number = Number(ship.getAttribute("score")),
                                    newScore:number = initialScore + 20;
                                    ship.setAttribute("score", ``+newScore+``) // update the score attribute of the ship
                                    document.getElementById("score")!.innerHTML = `Score: `+newScore+`` // add 20 to score for each successful shoot and destroy the small asteroid
                              })  
                      })                                                            
                  }) 

    }

    //----BIG ASTEROIDS----//
    // generates a big asteroid every 3 seconds
     Observable.interval(3000)
              .takeUntil(gameOverObservable(ship))
              .map(() => ({
                  astX: Math.random()*600,   // randomised initial x position of the asteroid
                  astY: Math.random()*600    // randomised initial y position of the asteroid
              }))
              // create a new big asteroid
              .map(({astX, astY}) => {
                  return new Elem(svg, "ellipse", asteroidg.elem)
                        .attr("id", "asteroid")
                        .attr("style", "cx:0; cy:0; rx:40; ry: 20; stroke:Tomato; stroke-width:2; fill:transparent")
                        .attr("transform", `translate(`+astX+` `+astY+`) rotate(180)`)
                        .attr("rx", "40")
                        .attr("ry","20");
              })
              .map(asteroid => ({asteroid, astOffset: randomOffset()})) // generate x & y offset for each asteroid so that each asteroid moves at random direction

              .flatMap(({asteroid, astOffset}) => {const ship = document.getElementById("ship")!,
                                                        astID = asteroid.elem.getAttribute("id")!;
                                                  return asteroidMovement(asteroid, astID, astOffset, ship); }) // move the big asteroids

              .subscribe(({asteroid, astTranslation}) => {
                  asteroid.attr("transform", `translate(`+astTranslation.newX+` `+astTranslation.newY+`) rotate(180)`);

                  // detects collision of each asteroid with the ship, check lives (initially the ship has 3 lives) when it becomes 0 then game over
                  // declare constants here to take the real-time data as the Observable executes
                  const
                      ship:HTMLElement = document.getElementById("ship")!,
                      shipg:HTMLElement = document.getElementById("shipG")!,
                      bulletList:Element[] = Array.from(document.getElementById("bulletG")!.children),
                      asteroidList:Element[] = Array.from(document.getElementById("asteroidG")!.children);

                  detectCollisionWithShip([asteroid.elem], shipg, 30).subscribe(() => {
                          const 
                            currentLives:number = Number(ship.getAttribute("lives")),
                            remainingLives:number = deductLife(currentLives);  // one life is deducted each time te ship collides with asteroid

                          ship.setAttribute("lives", ``+remainingLives+``); // update the remaining lives of ships
                          document.getElementById("lives")!.innerHTML = `Lives: `+remainingLives+``; // update the remaining lives on screen

                          gameOverChecking(remainingLives, ship, shipg, asteroidList, bulletList); // check if the game is over
                  });
                  

                  // detect collision between each asteroid with all the available bullets
                  // break the big asteroid into two smaller asteroids
                  detectCollisionWithBullet(bulletList, asteroid.elem, 30).map(() => getAttr(asteroid.elem))
                                                                          .map(astPosition => ({
                                                                                    // detremines the position of the two small asteroids
                                                                                    firstX: astPosition.x - 50,
                                                                                    firstY: astPosition.y - 40,
                                                                                    secondX: astPosition.x + 30,
                                                                                    secondY: astPosition.y + 80
                                                                            }))
                                                                          .map(({firstX, firstY, secondX, secondY}) => ({
                                                                                // create two small asteroids
                                                                                smallAst1: new Elem(svg, "circle", asteroidg.elem)
                                                                                    .attr("id", "smallAst1")
                                                                                    .attr("style", "cx:0; cy:0; r:20; stroke:Tomato; stroke-width:2; fill:transparent")
                                                                                    .attr("r", "20")
                                                                                    .attr("transform", `translate(`+firstX+` `+firstY+`) rotate(180)`),

                                                                                smallAst2: new Elem(svg, "circle", asteroidg.elem)
                                                                                    .attr("id", "smallAst2")
                                                                                    .attr("style", "cx:0; cy:0; r:20; stroke:Tomato; stroke-width:2; fill:transparent")
                                                                                    .attr("r", "20")
                                                                                    .attr("transform", `translate(`+secondX+` `+secondY+`) rotate(180)`)
                                                                            }))
                                                                          .subscribe(({smallAst1, smallAst2}) => {
                                                                                // delete the big asteroid
                                                                                asteroid.attr("style", "cx:0; cy:0; rx:0; ry: 0; stroke:Tomato; stroke-width:2; fill:transparent")
                                                                                        .attr("rx","0").attr("ry","0")      
                                                                                asteroid.elem.remove();

                                                                                // function that activates the Observable to move small asteroids & collision detection for the small asteroids
                                                                                smallAsteroids(smallAst1, smallAst2)
                                                                                
                                                                            })
              })     
              
}  


/**
 * Driver function of the monster.
 * The monster will start to appear 30s after the game starts. After the first appearance, a monster will be generated every 10s.
 * Each appearance of the monster will last for 10s. Similar to asteroid, the monster generated will appear at random places and move at random direction.
 * The monster created is indestructible, meaning the player cannot shoot bullet to kill it.
 * However, any collision between the monster and the ship will end the game.
 * Hence, the player needs to avoid contact with the monster as best as they can to stay alive.
 * 
 * This function is impure because it has side effects such as changing the attribute of elements and reading values from outside
 * the function scope.
 * However, this is inevitable because for the game to function, we cannot avoid side effects.
 * 
 * All the Observables have gameOverObservable(ship) in takeUntil() so that these Observables can stop when the lives of the
 * ship become zero and the game is over. 
 */
function monster():void{
    const 
      svg:HTMLElement = document.getElementById("canvas")!,
      shipg:HTMLElement = document.getElementById("shipG")!,
      ship:HTMLElement = document.getElementById("ship")!;

    // after 30s of the game, monster starts to appear, monster appears for 10s then disappear, new monster comes in every 10s 
    Observable.interval(20000).takeUntil(gameOverObservable(ship)).subscribe(() => {
        Observable.interval(10000)
                  .takeUntil(gameOverObservable(ship))
                  .takeUntil(Observable.interval(20000).map(() => document.getElementById("monster")!.remove())) // remove the monster after 10s it's been generated
                  .map(() => ({monsterX:Math.random()*600, monsterY:Math.random()*600})) // randomise the intial position of the monster
                  .map(({monsterX, monsterY}) => {
                        // create new monster
                        return new Elem(svg, "ellipse")
                                .attr("id", "monster")
                                .attr("style", "cx:0; cy:0; rx:30; ry:5; fill:grey")
                                .attr("transform", `translate(`+monsterX+` `+monsterY+`) rotate(90)`)
                  })
                  .map((monster) => ({monster, monsterOffset: randomOffset()})) // generate random x & y offset for each monster so that the movement of monster is randomiseds

                  .flatMap(({monster, monsterOffset}) => Observable.interval(0.01).takeUntil(gameOverObservable(ship)) // move the monster every 0.01ms so that it moves faster than the asteroids
                                                                    .map(() => getAttr(monster.elem))
                                                                    .map(monsterPosition => ({
                                                                      monster,
                                                                      monsterTranslation: moveElements(monsterPosition, monsterOffset)
                                                                    })))

                  .subscribe(({monster, monsterTranslation}) => {
                        monster.attr("transform", `translate(`+monsterTranslation.newX+` `+monsterTranslation.newY+`) rotate(90)`);

                        // once the ship collides with monster, the lives of ship becomes 0 and the game ends
                        detectCollisionWithShip([monster.elem], shipg, 20).subscribe(() => {
                            ship.setAttribute("lives", "0")
                            document.getElementById("lives")!.innerHTML = "Lives: 0"
                            document.getElementById("gameover")!.innerHTML = "GAME OVER"
                        })

                  })                  
    })
            
}


//----MAIN DRIVER OF THE GAME----//
if (typeof window != 'undefined')
  window.onload = ()=>{
    //----Creates Elements used in Instructions----//
    const svg = document.getElementById("canvas")!,
          startgroup = new Elem(svg, "g").attr("id", "start").attr("transform","translate (-20 100)"),
          startbutton = new Elem(svg, "rect", startgroup.elem).attr("x", "230").attr("y","350").attr("style", "fill: lightblue").attr("width","150").attr("height","60"),
          starttext = new Elem(svg, "text", startgroup.elem).attr("x","280").attr("y","390").attr("style","font-size:150%; fill:black;"),
          welcomeText = document.getElementById("welcome")!,
          instructionText = document.getElementById("instruction")!,
          cautionText = document.getElementById("caution")!;
    
    //----INSTRUCTION/ PLAYER MANUAL----//
    starttext.elem.textContent = "Start"; // Word on Start button
    welcomeText.textContent = "WELCOME TO ASTEROIDS!\r\n\n"

    instructionText.textContent = "Press LEFT or RIGHT to rotate.\r\n" +
                                  "Press UP to move forward.\r\n" +
                                  "SPACEBAR to shoot.\r\n\n";
                                  
    cautionText.textContent = "BEWARE: The space is dangerous. Watch out for ENEMIES.\r\n" + 
                              "They come and go as they wish and are INDESTRUCTIBLE!\r\n" +
                              "They can KILL you instantly though.\r\n"  +
                              "So, AVOID them if you see them!";

    //After the user click on the Start button, closes the start menu and starts the game
    startbutton.observe<MouseEvent>("mousedown")
               .subscribe(() => {
                 startgroup.elem.remove();
                 welcomeText.style.display = "none";
                 instructionText.style.display = "none";
                 cautionText.style.display = "none";
                 document.getElementById("gamestart")!.innerHTML = "GAME START!";
                 Observable.interval(1500).subscribe(() => document.getElementById("gamestart")!.innerHTML = "")
                 spaceship();
                 asteroids();
                 monster();
               }) 
    
  }

