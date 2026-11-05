import apiClient from '../lib/axios'

export interface DailyNutritionSummary {
    date: string
    caloriesTarget: number
    caloriesConsumed: number
    caloriesBurned: number
    caloriesRemaining: number
    netCalories: number
    protein: MacroSummary
    carbs: MacroSummary
    fat: MacroSummary
    waterTargetGlasses: number
    waterConsumedGlasses: number
    hasBodyMetrics: boolean
    fitnessGoal: string
    waterReminderStartTime?: string
    waterReminderEndTime?: string
    workoutRecovery?: WorkoutRecoveryNutrition
}

export interface MacroSummary {
    currentGrams: number
    targetGrams: number
    percentage: number
}

export interface RecoveryNutrientAdvice {
    nutrient: string
    targetAmount: string
    purpose: string
    priority: string
    bestFoodSources?: string
}

export interface RecommendedFood {
    id: number
    name: string
    servingSize?: string
    unit?: string
    calories: number
    protein: number
    carbs: number
    fat: number
    imageUrl?: string
    category: string
    categoryLabel: string
    recoveryBenefit: string
}

export interface SuggestedMealSection {
    mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | string
    mealTitle: string
    calories: number
    protein: number
    carbs: number
    fat: number
    foods: RecommendedFood[]
}

export interface SuggestedRecoveryCombo {
    title: string
    mealType?: string
    targetGoal?: string
    description: string
    totalCalories: number
    totalProtein: number
    totalCarbs: number
    totalFat: number
    foods: RecommendedFood[]
    meals?: SuggestedMealSection[]
}

export interface WorkoutRecoveryNutrition {
    caloriesBurned: number
    recommendedReplenishCalories: number
    guidanceMessage: string
    nutrientsToReplenish: RecoveryNutrientAdvice[]
    recommendedFoods: RecommendedFood[]
    suggestedCombos: SuggestedRecoveryCombo[]
}

export const getDailySummary = async (date: string, caloriesBurned?: number): Promise<DailyNutritionSummary> => {
    const params = caloriesBurned != null ? `&caloriesBurned=${caloriesBurned}` : ''
    const response = await apiClient.get(`/nutrition/daily?date=${date}${params}`)
    return response.data
}

export const logWater = async (date: string, glasses: number = 1): Promise<DailyNutritionSummary> => {
    const response = await apiClient.post(`/nutrition/water?date=${date}`, { glasses })
    return response.data
}

export const updateReminderSettings = async (startTime: string, endTime: string): Promise<{ success: boolean }> => {
    const response = await apiClient.put('/nutrition/reminder-settings', { startTime, endTime })
    return response.data
}

export const getWorkoutRecoveryNutrition = async (caloriesBurned?: number): Promise<WorkoutRecoveryNutrition> => {
    const params = caloriesBurned != null ? `?caloriesBurned=${caloriesBurned}` : ''
    const response = await apiClient.get(`/nutrition/workout-recovery${params}`)
    return response.data
}

export const logFood = async (date: string, foodId: number, servings: number = 1): Promise<DailyNutritionSummary> => {
    const response = await apiClient.post(`/nutrition/food?date=${date}`, { foodId, servings })
    return response.data
}


export interface DietPlanResponse {
    diet_title?: string;
    daily_calories?: number;
    protein_target_g?: number;
    carbs_target_g?: number;
    fat_target_g?: number;
    meals?: any[];
    recommendation?: {
        plan_type: string;
        target_calories: number;
        meals: any[];
        shopping_list: string[];
        meal_prep_tips: string[];
        disclaimer: string;
    };
}