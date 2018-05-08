/* Class to optimize searching nearby objects. Implements modular airthmetic */
import {vec2} from "gl-matrix";

export class Grid {
    constructor(sizeX, sizeY, height, width){
        this.height = height; // width and height of the original space
        this.width = width;

        this.sizeX = sizeX; // our grid size
        this.sizeY = sizeY;
        this.grid = {}; // grid to put in objects
    }

    push(pos, obj) {
        let gridPos = this.getGridPos(pos[0], pos[1]);
        let key = gridPos.toString();
        if (!this.grid[key]) {
            this.grid[key] = [[pos, obj]];
        } else {
            this.grid[key].push([pos, obj]);
        }
    }

    remove(pos, obj) {
        let gridPos = this.getGridPos(pos[0], pos[1]);
        let tile = this.grid[gridPos.toString()];
        let i = 0;
        for (; i < tile.length; i++) {
            if (tile[i][1] === obj) break;
        }
        tile.splice(i, 1);
    }

    modDist(v1, v2) {
        // find minimum x difference
        let x1 = v1[0];
        let x2 = v2[0];
        let minX = Math.min(
            Math.abs(x1 - x2), 
            Math.abs(x1 - x2 + this.width), 
            Math.abs(x1 - x2 - this.width));

        let y1 = v1[1];
        let y2 = v2[1];
        let minY = Math.min(
            Math.abs(y1 - y2), 
            Math.abs(y1 - y2 + this.height), 
            Math.abs(y1 - y2 - this.height));
        return Math.sqrt(minX * minX + minY * minY);
    }

    findNearby(pos, radius){
        let origX = pos[0];
        let origY = pos[1];
        let minGridPos = this.getGridPos(origX - radius, origY - radius);
        let maxGridPos = this.getGridPos(origX + radius, origY + radius);
        let minX = minGridPos[0];
        let minY = minGridPos[1];
        let maxX = maxGridPos[0];
        let maxY = maxGridPos[1];

        let nearbyObj = [];
        for (let i = 0; i <= (maxX - minX + this.sizeX) % this.sizeX ; i++) {
            for (let j = 0; j <= (maxY - minY + this.sizeY) % this.sizeY; j++) {
                let key = [
                    (i + minX) % this.sizeX, 
                    (j + minY) % this.sizeY
                    ].toString();
                
                if (!this.grid[key]) continue;

                for(let posObj of this.grid[key]) {
                    let targetPos = posObj[0];
                    if (pos !== targetPos && this.modDist(pos, targetPos) < radius) {
                        nearbyObj.push(posObj);
                    }
                }
            }
        }
        return nearbyObj;
    }

    /*Returns nearest x number of objects under some radius*/
    getNearestXRadius(pos, radius, count) {
        let nearbyObj = this.findNearby(pos, radius);
        nearbyObj.sort((a, b) => {
            let dist_a = vec2.dist(a[0], pos);
            let dist_b = vec2.dist(b[0], pos);
            return dist_a - dist_b;
        });
        return nearbyObj.slice(0, count);
    }

    // get associated grid coordinates
    // does not work if origX and origY are not in the range of 
    // -width < origX < 2 * width
    // -height < origY < 2 * height
    getGridPos(origX, origY) {
        let gridX = Math.floor(origX / (this.width + 1) * this.sizeX);
        let gridY = Math.floor(origY / (this.height + 1) * this.sizeY);
        gridX = (gridX + this.sizeX) % this.sizeX; // apply wrap around
        gridY = (gridY + this.sizeY) % this.sizeY; // apply wrap around 
        return vec2.fromValues(gridX, gridY);
    }
}