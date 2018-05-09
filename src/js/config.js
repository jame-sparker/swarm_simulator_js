export const NUM_BIRDS = 200;
export const BIRD_DETECTION = 5; // number of detectable nearby birds
export const MAX_WIDTH = 16.5;
export const MAX_HEIGHT = MAX_WIDTH / 2;
export const MAX_ACCELERATION = 5;
export const C = 0.1 // drag coefficient

export const GRID_X = 20;
export const GRID_Y = GRID_X / 2;
export const SHOW_CONNECTION_LINES = true;
export const INIT_VEL_RANGE = 1;

// Machine learning parameters
// Penalty function parameters
export const CUTOFF_RADIUS = 1.5;
export const OPT_MAX_DISTANCE = 0.4; // optimal max distance
export const OPT_MIN_DISTANCE = 0.12; // optimal min distance
export const MIN_ALLOWED_SPEED = 1.5; // Penalty if the speed is below this value;
// Error function evaluated below this point is less than MAX_DISTANCE_ERROR
// Must be greater than OPT_MIN_DISTANCE
export const MAX_DISTANCE = 2; 
export const MAX_DISTANCE_ERROR = 2; // Maximum distance error per bird pair
export const BIRD_REQUIRED = 3; // number of required nearby birds
// a, b, and c for the quadradic function specified above
export const QUAD_DIST_A = 
    (Math.pow(MAX_DISTANCE, 2) - OPT_MAX_DISTANCE * (2 + OPT_MAX_DISTANCE)) / MAX_DISTANCE_ERROR;
export const QUAD_DIST_B = -2 * QUAD_DIST_A * OPT_MAX_DISTANCE;
export const QUAD_DIST_C = QUAD_DIST_A * Math.pow(OPT_MAX_DISTANCE, 2);

export const ERROR_SCALAR = 0.1;

// NEAT Parameters
export const MUTATION_RATE = 0.2;
export const START_HIDDEN_SIZE = 0;