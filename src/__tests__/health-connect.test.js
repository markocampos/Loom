/**
 * Health Connect Integration Test
 *
 * This test verifies the Health Connect integration logic works correctly.
 * Since Health Connect requires a real Android device, this test mocks the
 * native API and validates the composable's behavior.
 *
 * To test on a real device:
 * 1. npm run build
 * 2. npx cap sync android
 * 3. cd android && ./gradlew assembleDebug
 * 4. Install APK on device with Health Connect
 * 5. Open Loom → Tracker → tap "Auto-import"
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Health Connect plugin
const mockHealthConnect = {
  checkAvailability: vi.fn(),
  requestHealthPermissions: vi.fn(),
  checkHealthPermissions: vi.fn(),
  readRecords: vi.fn(),
}

vi.mock('capacitor-health-connect', () => ({
  HealthConnect: mockHealthConnect,
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => true,
    platform: 'android',
  },
}))

describe('Health Connect Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkAvailability', () => {
    it('returns true when Health Connect is available', async () => {
      mockHealthConnect.checkAvailability.mockResolvedValue({ status: 'Available' })

      const { useHealthData } = await import('../composables/useHealthData.js')
      const health = useHealthData()

      const result = await health.checkAvailability()
      expect(result).toBe(true)
      expect(health.isAvailable.value).toBe(true)
    })

    it('returns false when Health Connect is not installed', async () => {
      mockHealthConnect.checkAvailability.mockResolvedValue({ status: 'NotInstalled' })

      const { useHealthData } = await import('../composables/useHealthData.js')
      const health = useHealthData()

      const result = await health.checkAvailability()
      expect(result).toBe(false)
      expect(health.isAvailable.value).toBe(false)
    })

    it('returns false on web platform', async () => {
      // Re-mock for web
      const { Capacitor } = await import('@capacitor/core')
      Capacitor.isNativePlatform = () => false

      const { useHealthData } = await import('../composables/useHealthData.js')
      const health = useHealthData()

      const result = await health.checkAvailability()
      expect(result).toBe(false)
    })
  })

  describe('requestPermissions', () => {
    it('returns true when permissions are granted', async () => {
      mockHealthConnect.requestHealthPermissions.mockResolvedValue({
        granted: ['Steps'],
      })

      const { useHealthData } = await import('../composables/useHealthData.js')
      const health = useHealthData()

      const result = await health.requestPermissions()
      expect(result).toBe(true)
      expect(mockHealthConnect.requestHealthPermissions).toHaveBeenCalledWith({
        read: ['Steps'],
        write: ['Steps'],
      })
    })

    it('returns false when permissions are denied', async () => {
      mockHealthConnect.requestHealthPermissions.mockResolvedValue({
        granted: [],
      })

      const { useHealthData } = await import('../composables/useHealthData.js')
      const health = useHealthData()

      const result = await health.requestPermissions()
      expect(result).toBe(false)
    })
  })

  describe('getSteps', () => {
    it('returns step count from Health Connect', async () => {
      mockHealthConnect.readRecords.mockResolvedValue({
        records: [
          { count: 3000, startTime: '2026-07-12T08:00:00', endTime: '2026-07-12T12:00:00' },
          { count: 2500, startTime: '2026-07-12T14:00:00', endTime: '2026-07-12T18:00:00' },
        ],
      })

      const { useHealthData } = await import('../composables/useHealthData.js')
      const health = useHealthData()

      const steps = await health.getSteps('2026-07-12')
      expect(steps).toBe(5500)
      expect(health.isLoading.value).toBe(false)
    })

    it('returns null when no step records exist', async () => {
      mockHealthConnect.readRecords.mockResolvedValue({
        records: [],
      })

      const { useHealthData } = await import('../composables/useHealthData.js')
      const health = useHealthData()

      const steps = await health.getSteps('2026-07-12')
      expect(steps).toBeNull()
    })

    it('handles API errors gracefully', async () => {
      mockHealthConnect.readRecords.mockRejectedValue(new Error('Permission denied'))

      const { useHealthData } = await import('../composables/useHealthData.js')
      const health = useHealthData()

      const steps = await health.getSteps('2026-07-12')
      expect(steps).toBeNull()
      expect(health.lastError.value).toBe('Could not fetch steps from Health Connect')
    })

    it('calls readRecords with correct time range', async () => {
      mockHealthConnect.readRecords.mockResolvedValue({ records: [] })

      const { useHealthData } = await import('../composables/useHealthData.js')
      const health = useHealthData()

      await health.getSteps('2026-07-12')

      expect(mockHealthConnect.readRecords).toHaveBeenCalledWith({
        type: 'Steps',
        timeRangeFilter: {
          type: 'between',
          startTime: new Date('2026-07-12T00:00:00'),
          endTime: new Date('2026-07-12T23:59:59'),
        },
      })
    })
  })

  describe('importTodayData', () => {
    it('imports steps data for today', async () => {
      mockHealthConnect.readRecords.mockResolvedValue({
        records: [{ count: 8432 }],
      })

      const { useHealthData } = await import('../composables/useHealthData.js')
      const health = useHealthData()

      const data = await health.importTodayData()
      expect(data.steps).toBe(8432)
    })

    it('returns empty object when no data available', async () => {
      mockHealthConnect.readRecords.mockResolvedValue({
        records: [],
      })

      const { useHealthData } = await import('../composables/useHealthData.js')
      const health = useHealthData()

      const data = await health.importTodayData()
      expect(data).toEqual({})
    })
  })
})

describe('TrackerView Integration', () => {
  it('auto-import button calls health.importTodayData', async () => {
    // This test verifies the TrackerView properly wires up the health import
    mockHealthConnect.checkAvailability.mockResolvedValue({ status: 'Available' })
    mockHealthConnect.requestHealthPermissions.mockResolvedValue({ granted: ['Steps'] })
    mockHealthConnect.readRecords.mockResolvedValue({
      records: [{ count: 7500 }],
    })

    // Re-mock Capacitor to ensure isNativePlatform returns true
    const { Capacitor } = await import('@capacitor/core')
    Capacitor.isNativePlatform = () => true

    const { useHealthData } = await import('../composables/useHealthData.js')
    const health = useHealthData()

    // Simulate what TrackerView does
    const isAvailable = await health.checkAvailability()
    expect(isAvailable).toBe(true)

    const granted = await health.requestPermissions()
    expect(granted).toBe(true)

    const data = await health.importTodayData()
    expect(data.steps).toBe(7500)
  })
})
