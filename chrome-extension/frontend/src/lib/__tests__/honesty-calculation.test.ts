import { calculateHonestyScore, getMikeMoodFromHonesty } from '../db-service';
import { HonestyMetrics, MikeMood } from '../types';

describe('Honesty Calculation System', () => {
  describe('calculateHonestyScore', () => {
    it('should calculate perfect honesty score', () => {
      const perfectMetrics: HonestyMetrics = {
        taskUpdateFrequency: 1.0,
        statusVariety: 1.0,
        timelyUpdates: 1.0,
        consistentCheckins: 1.0
      };
      
      const score = calculateHonestyScore(perfectMetrics);
      expect(score).toBe(100);
    });
    
    it('should calculate low honesty score', () => {
      const lowMetrics: HonestyMetrics = {
        taskUpdateFrequency: 0.1,
        statusVariety: 0.1,
        timelyUpdates: 0.1,
        consistentCheckins: 0.1
      };
      
      const score = calculateHonestyScore(lowMetrics);
      expect(score).toBe(10);
    });
    
    it('should weight task updates and status variety more heavily', () => {
      const taskFocusedMetrics: HonestyMetrics = {
        taskUpdateFrequency: 1.0,
        statusVariety: 1.0,
        timelyUpdates: 0.0,
        consistentCheckins: 0.0
      };
      
      const score = calculateHonestyScore(taskFocusedMetrics);
      expect(score).toBe(60); // 30% + 30% = 60%
    });
  });
  
  describe('getMikeMoodFromHonesty', () => {
    it('should return HAPPY for high honesty scores', () => {
      expect(getMikeMoodFromHonesty(85)).toBe(MikeMood.HAPPY);
      expect(getMikeMoodFromHonesty(70)).toBe(MikeMood.HAPPY);
    });
    
    it('should return NEUTRAL for medium honesty scores', () => {
      expect(getMikeMoodFromHonesty(60)).toBe(MikeMood.NEUTRAL);
      expect(getMikeMoodFromHonesty(40)).toBe(MikeMood.NEUTRAL);
    });
    
    it('should return SAD for low honesty scores', () => {
      expect(getMikeMoodFromHonesty(30)).toBe(MikeMood.SAD);
      expect(getMikeMoodFromHonesty(10)).toBe(MikeMood.SAD);
    });
    
    it('should handle edge cases correctly', () => {
      expect(getMikeMoodFromHonesty(70)).toBe(MikeMood.HAPPY); // Boundary
      expect(getMikeMoodFromHonesty(39)).toBe(MikeMood.SAD);   // Just below neutral
    });
  });
});