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
        let gridPos = this.getGridPos(pos);
        let key = gridPos.toString();
        if (!grid[key]) {
            grid[key] = [[pos, obj]];
        } else {
            grid[key].push([pos, obj]);
        }
    }

    remove(pos, obj) {
        let gridPos = this.getGridPos(pos);
        let tile = this.grid[gridPos.toString()];
        let i = 0;
        for (; i < tile.length; i++) {
            if (tile[i][1] === obj) break;
        }
        this.tile.splice(i, 1);
    }

    findNearbyAll(pos, radius) {
        let nearbyObj = [];
        for (let key in this.grid) {
            for( let posObj in this.grid[key]) {
                let targetPos = posObj[0];
                if (vec2.dist(pos, targetPos) < radius) {
                    nearbyObj.push(posObj[1]);
                }
            }
        }
        return nearbyObj;
    }

    findNearby(pos, radius){
        let origX = pos[0];
        let origY = pos[1];
        let minGridPos = this.getGridPos(origX - radius, origY - radius);
        let maxGridPos = this.getGridPos(origX + radius, origY + radius);
        let minX = minGridPos[0];
        let minY = minGridPos[1];
        let maxX = manGridPos[0];
        let maxY = maxGridPos[1];

        if ((maxX + 1) % this.sizeX == minX || 
            (maxY + 1) % this.sizeY == minY) {
            return findNearbyAll(pos, radius);
        }
        let nearbyObj = [];
        for (let i = minX; i >= minX || i <= maxX; i++) {
            for (let j = minY; j >= minY || j <= maxY; j++) {
                let targetGrid = this.grid[[i, j].toString()]
                for( let posObj in this.grid[key]) {
                    let targetPos = posObj[0];
                    if (vec2.dist(pos, targetPos) < radius) {
                        nearbyObj.push(posObj[1]);
                    }
                }
            }
        }
        return nearbyObj;
    }

    // get associated grid coordinates
    // does not work if origX and origY are not in the range of 
    // -width < origX < 2 * width
    // -height < origY < 2 * height
    getGridPos(origX, origY) {
        let gridX = Math.floor(origX / (this.width + 1) * this.sizeX);
        let gridY = Math.floor(origY / (this.height + 1) * this.sizeY);
        gridX = (gridX + this.sizeX) % sizeX; // apply wrap around
        gridY = (gridY + this.sizeY) % sizeY; // apply wrap around 
        return vec2.fromValues(gridX, gridY);
    }
}