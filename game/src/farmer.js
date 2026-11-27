import { CONFIG } from './config.js';
import { stageAtX } from './world.js';

const settings = CONFIG.farmer;

export class Farmer {
  constructor(x = 0) {
    this.reset(x);
  }

  reset(x = 0) {
    this.x = x;
    this.state = 'chase';
    this.facing = 1;
    this.runPhase = 0;
    this.justSpotted = false;
    this.lastSeenX = x;
    this.sightLoss = 0;
    this.searchLookTime = 0;
    this.retreating = false;
    this.awaitingReacquisition = false;
    this.rubberBanding = false;
    this.burstClock = 0;
    this.burstRemaining = 0;
    this.lungeRemaining = 0;
    this.lungeCooldown = 0;
  }

  moveTo(x) {
    const distance = x - this.x;
    if (!distance) return;
    this.x = x;
    this.facing = Math.sign(distance);
    this.runPhase = (this.runPhase + Math.abs(distance) / settings.STRIDE_LENGTH) % 1;
  }

  update(dt, turkey, world) {
    this.justSpotted = false;
    this.lungeCooldown = Math.max(0, this.lungeCooldown - dt);
    const { stageIndex } = stageAtX(world, turkey.x);
    const chaseSpeed = settings.CHASE_SPEED[stageIndex];

    if (this.state === 'search') {
      this.updateSearch(dt, turkey, chaseSpeed);
      return;
    }

    if (turkey.hidden) {
      this.sightLoss += dt;
      if (this.sightLoss >= settings.SIGHT_LOSS_SECONDS) {
        this.state = 'search';
        this.searchLookTime = 0;
        this.awaitingReacquisition = true;
        this.burstRemaining = 0;
        this.lungeRemaining = 0;
        return;
      }
    } else {
      this.lastSeenX = turkey.x;
      this.sightLoss = 0;
      this.justSpotted = this.awaitingReacquisition;
      this.awaitingReacquisition = false;
    }

    const gap = turkey.x - this.x;
    if (this.state === 'chase' && stageIndex === settings.LUNGE_STAGE_INDEX
      && !turkey.hidden && Math.abs(gap) <= settings.LUNGE_DISTANCE && this.lungeCooldown === 0) {
      this.state = 'lunge';
      this.lungeRemaining = settings.LUNGE_SECONDS;
      this.lungeCooldown = settings.LUNGE_COOLDOWN;
    }

    const limit = turkey.x + settings.MAX_LEAD;
    if (this.state === 'lunge') {
      const lungeTime = Math.min(dt, this.lungeRemaining);
      this.moveTo(Math.min(limit, this.x + settings.LUNGE_SPEED * lungeTime));
      this.lungeRemaining -= lungeTime;
      if (this.lungeRemaining > 0) return;
      this.state = 'chase';
      dt -= lungeTime;
    }

    if (gap > settings.RUBBER_BAND_GAP) this.rubberBanding = true;
    else if (gap <= settings.RUBBER_BAND_RELEASE_GAP) this.rubberBanding = false;
    const bonus = this.rubberBanding ? settings.RUBBER_BAND_SPEED_BONUS : 0;

    let burstTime = 0;
    if (stageIndex >= settings.BURST_FIRST_STAGE_INDEX) {
      const timeUntilBurst = settings.BURST_EVERY_SECONDS - this.burstClock;
      this.burstClock = (this.burstClock + dt) % settings.BURST_EVERY_SECONDS;
      if (dt >= timeUntilBurst) {
        const newBurstTime = Math.min(dt - timeUntilBurst, settings.BURST_SECONDS);
        burstTime = Math.min(timeUntilBurst, this.burstRemaining) + newBurstTime;
        this.burstRemaining = settings.BURST_SECONDS - newBurstTime;
      } else {
        burstTime = Math.min(dt, this.burstRemaining);
        this.burstRemaining -= burstTime;
      }
    }

    const distance = (chaseSpeed + bonus) * (dt - burstTime)
      + (settings.BURST_SPEED + bonus) * burstTime;
    this.moveTo(Math.min(limit, this.x + distance));
  }

  updateSearch(dt, turkey, chaseSpeed) {
    if (!this.retreating) {
      const distance = this.lastSeenX - this.x;
      const travelTime = Math.min(dt, Math.abs(distance) / settings.SEARCH_SPEED);
      const step = dt * settings.SEARCH_SPEED;
      this.moveTo(step >= Math.abs(distance) ? this.lastSeenX : this.x + Math.sign(distance) * step);
      const lookTime = dt - travelTime;
      if (lookTime <= 0) return;

      const previousLook = Math.floor(this.searchLookTime / settings.SEARCH_LOOK_INTERVAL);
      this.searchLookTime += lookTime;
      const currentLook = Math.floor(this.searchLookTime / settings.SEARCH_LOOK_INTERVAL);
      if (previousLook % 2 !== currentLook % 2) this.facing *= -1;
      if (this.searchLookTime < settings.SEARCH_SECONDS) return;

      this.retreating = true;
      dt = this.searchLookTime - settings.SEARCH_SECONDS;
    }

    const target = turkey.x - settings.RETREAT_GAP;
    if (this.x > target) this.moveTo(Math.max(target, this.x - chaseSpeed * dt));
    if (this.x > target) return;

    this.retreating = false;
    this.state = 'chase';
    this.facing = 1;
    this.sightLoss = 0;
    if (!turkey.hidden) {
      this.lastSeenX = turkey.x;
      this.justSpotted = true;
      this.awaitingReacquisition = false;
    }
  }

  caught(turkey) {
    if (turkey.hidden || Math.abs(this.x - turkey.x) >= settings.CATCH_DISTANCE) return false;
    const { feetY } = turkey.hitbox();
    return feetY >= CONFIG.view.GROUND_Y - settings.CATCH_HEIGHT;
  }
}
