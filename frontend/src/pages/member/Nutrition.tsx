import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
    Box,
    Flex,
    Grid,
    Heading,
    Text,
    Stack,
    HStack,
    Icon,
    IconButton,
    Button,
    Badge,
    Image,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Input,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    useToast,
} from '@chakra-ui/react'
import {
    FiChevronLeft,
    FiChevronRight,
    FiPlus,
    FiSearch,
    FiDroplet,
    FiZap,
    FiActivity,
    FiCheck,
    FiTrendingUp,
    FiTrash2,
    FiLayers,
    FiTarget,
    FiCheckCircle,
} from 'react-icons/fi'
import useSWR, { mutate as globalMutate } from 'swr'
import apiClient from '../../lib/axios'
import MemberLayout from '../../components/shared/Layout/MemberLayout'
import {
    logWater,
    logFood,
    type DailyNutritionSummary,
    type RecommendedFood,
    type SuggestedRecoveryCombo,
} from '../../api/nutrition'
import { useAuthStore } from '../../store/useAuthStore'

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data)

/* ── Fallback food images for clean UI ─── */
const getFoodImage = (food: { name: string; imageUrl?: string | null }): string => {
    if (food.imageUrl && food.imageUrl.trim().length > 0) return food.imageUrl
    const lower = food.name.toLowerCase()
    if (lower.includes('chicken'))
        return 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=300&auto=format&fit=crop&q=80'
    if (lower.includes('salmon'))
        return 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&auto=format&fit=crop&q=80'
    if (lower.includes('tuna'))
        return 'https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?w=300&auto=format&fit=crop&q=80'
    if (lower.includes('beef'))
        return 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=300&auto=format&fit=crop&q=80'
    if (lower.includes('pork'))
        return 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=300&auto=format&fit=crop&q=80'
    if (lower.includes('shrimp'))
        return 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=300&auto=format&fit=crop&q=80'
    if (lower.includes('whey'))
        return 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=300&auto=format&fit=crop&q=80'
    if (lower.includes('egg'))
        return 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=300&auto=format&fit=crop&q=80'
    if (lower.includes('yogurt'))
        return 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&auto=format&fit=crop&q=80'
    if (lower.includes('cheese'))
        return 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=300&auto=format&fit=crop&q=80'
    if (lower.includes('oat'))
        return 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=300&auto=format&fit=crop&q=80'
    if (lower.includes('sweet potato') || lower.includes('potato'))
        return 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=300&auto=format&fit=crop&q=80'
    if (lower.includes('brown rice') || lower.includes('rice'))
        return 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=300&auto=format&fit=crop&q=80'
    if (lower.includes('bread'))
        return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop&q=80'
    if (lower.includes('banana'))
        return 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&auto=format&fit=crop&q=80'
    if (lower.includes('avocado'))
        return 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=300&auto=format&fit=crop&q=80'
    if (lower.includes('almond') || lower.includes('peanut'))
        return 'https://images.unsplash.com/photo-1508061252445-8450f65604da?w=300&auto=format&fit=crop&q=80'
    if (lower.includes('broccoli'))
        return 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=300&auto=format&fit=crop&q=80'
    if (lower.includes('spinach') || lower.includes('salad'))
        return 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&auto=format&fit=crop&q=80'
    if (lower.includes('apple'))
        return 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&auto=format&fit=crop&q=80'
    if (lower.includes('orange'))
        return 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=300&auto=format&fit=crop&q=80'
    if (lower.includes('tomato'))
        return 'https://images.unsplash.com/photo-1546470427-227c7369a9e8?w=300&auto=format&fit=crop&q=80'
    if (lower.includes('cucumber'))
        return 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=300&auto=format&fit=crop&q=80'
    return 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=300&auto=format&fit=crop&q=80'
}

/* ── Custom Water Cup Icon ─── */
const WaterCup: React.FC<{ filled: boolean; onClick?: () => void }> = ({ filled, onClick }) => (
    <Box
        as="button"
        onClick={onClick}
        cursor={onClick ? 'pointer' : 'default'}
        transition="all 0.2s"
        _hover={onClick ? { transform: 'scale(1.15)' } : undefined}
        flexShrink={0}
    >
        <svg width="27" height="35" viewBox="0 0 26 34" fill="none">
            <path
                d="M3 4H23L20.5 28C20.3 30 18.5 31.5 16.5 31.5H9.5C7.5 31.5 5.7 30 5.5 28L3 4Z"
                fill={filled ? '#F27A7A' : '#141720'}
                stroke={filled ? '#F27A7A' : '#2e3040'}
                strokeWidth="1.5"
            />
            {filled ? (
                <path
                    d="M13 13C13 13 10.5 17 10.5 18.5C10.5 19.9 11.6 21 13 21C14.4 21 15.5 19.9 15.5 18.5C15.5 17 13 13 13 13Z"
                    fill="#141720"
                    opacity="0.65"
                />
            ) : (
                <path
                    d="M13 14C13 14 11 17.5 11 19C11 20.1 11.9 21 13 21C14.1 21 15 20.1 15 19C15 17.5 13 14 13 14Z"
                    fill="#2e3040"
                    opacity="0.8"
                />
            )}
        </svg>
    </Box>
)

/* ── Calories Donut Ring ─── */
const CaloriesDonut: React.FC<{ current: number; total: number }> = ({ current, total }) => {
    const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0
    const r = 68
    const strokeW = 14
    const cx = 95
    const cy = 95
    const circumference = 2 * Math.PI * r
    const offset = circumference - (pct / 100) * circumference

    return (
        <Box position="relative" w="190px" h="190px" mx="auto" my="1">
            <svg width="190" height="190">
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#232733" strokeWidth={strokeW} />
                <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke="#E03030"
                    strokeWidth={strokeW}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${cx} ${cy})`}
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
            </svg>
            <Box
                position="absolute"
                inset="0"
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
            >
                <Text fontSize="30px" fontWeight="900" color="white" lineHeight="1">
                    {current.toLocaleString()}
                </Text>
                <Text fontSize="12px" color="#8A8A93" mt="1.5">
                    / {total.toLocaleString()} kcal
                </Text>
            </Box>
        </Box>
    )
}

/* ── Macro Card ─── */
const MacroMetricCard: React.FC<{
    title: string
    current: number
    target: number
    barColor: string
    icon: React.ReactNode
}> = ({ title, current, target, barColor, icon }) => {
    const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0

    return (
        <Box
            bg="#141720"
            border="1px solid"
            borderColor="#1e2028"
            borderRadius="18px"
            p="5"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            h="full"
        >
            <Flex justify="space-between" align="center">
                <Text fontSize="15px" fontWeight="700" color="white">
                    {title}
                </Text>
                <Box
                    w="26px"
                    h="26px"
                    borderRadius="full"
                    border="1px solid #2e3040"
                    bg="#1a1d26"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="#8A8A93"
                >
                    {icon}
                </Box>
            </Flex>

            <Flex align="baseline" gap="1.5" mt="5" mb="3">
                <Text fontSize="26px" fontWeight="800" color="white" lineHeight="1">
                    {current}g
                </Text>
                <Text fontSize="11px" color="#8A8A93">
                    / {target}g
                </Text>
            </Flex>

            <Box h="3px" bg="#232733" borderRadius="full" overflow="hidden">
                <Box
                    h="full"
                    borderRadius="full"
                    bg={barColor}
                    style={{ width: `${pct}%` }}
                    transition="width 0.8s ease"
                />
            </Box>
        </Box>
    )
}

/* ── Meal Item Interface & Component ─── */
interface MealItemData {
    id: number
    name: string
    serving: string
    calories: number
    protein: number
    carbs: number
    fat: number
    imageUrl: string
}

const MealItemRow: React.FC<{
    item: MealItemData
    onRemove?: () => void
}> = ({ item, onRemove }) => (
    <Flex
        align="center"
        justify="space-between"
        bg="#141720"
        border="1px solid"
        borderColor="#1e2028"
        borderRadius="16px"
        p="4"
        gap="4"
        transition="all 0.15s"
        _hover={{ borderColor: '#2e3040' }}
    >
        <HStack spacing="3.5" minW="0" flex="1">
            <Box
                w="50px"
                h="50px"
                borderRadius="12px"
                overflow="hidden"
                bg="#1a1d26"
                border="1px solid #232733"
                flexShrink={0}
            >
                <Image
                    src={getFoodImage(item)}
                    alt={item.name}
                    w="full"
                    h="full"
                    objectFit="cover"
                    fallback={<Box w="full" h="full" bg="#232733" />}
                />
            </Box>
            <Box minW="0">
                <Text fontSize="14px" fontWeight="700" color="white" noOfLines={1}>
                    {item.name}
                </Text>
                <Text fontSize="12px" color="#8A8A93" mt="0.5">
                    {item.serving} • <Text as="span" color="#F27A7A" fontWeight="600">{item.calories} kcal</Text>
                </Text>
            </Box>
        </HStack>

        <HStack spacing={{ base: '2.5', sm: '4' }} flexShrink={0}>
            <Box textAlign="center">
                <Text fontSize="9px" fontWeight="700" color="#8A8A93" textTransform="uppercase">
                    PRO
                </Text>
                <Text fontSize="12px" fontWeight="700" color="white">
                    {item.protein}g
                </Text>
            </Box>
            <Box textAlign="center">
                <Text fontSize="9px" fontWeight="700" color="#8A8A93" textTransform="uppercase">
                    CARB
                </Text>
                <Text fontSize="12px" fontWeight="700" color="white">
                    {item.carbs}g
                </Text>
            </Box>
            <Box textAlign="center">
                <Text fontSize="9px" fontWeight="700" color="#8A8A93" textTransform="uppercase">
                    FAT
                </Text>
                <Text fontSize="12px" fontWeight="700" color="white">
                    {item.fat}g
                </Text>
            </Box>
            {onRemove && (
                <IconButton
                    aria-label="Remove item"
                    icon={<Icon as={FiTrash2} boxSize="13px" />}
                    size="xs"
                    variant="ghost"
                    color="#8A8A93"
                    _hover={{ color: '#E03030', bg: 'rgba(224,48,48,0.1)' }}
                    onClick={onRemove}
                />
            )}
        </HStack>
    </Flex>
)

type MealTypeSection = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'

/* ── Nutrition Page Component ─────────────────── */
const Nutrition: React.FC = () => {
    const location = useLocation()
    const navState = location.state as { justFinishedWorkout?: boolean; workoutCalories?: number } | null
    const workoutCaloriesParam = navState?.workoutCalories

    const [currentDate, setCurrentDate] = useState<Date>(new Date())
    const dateStr = currentDate.toISOString().split('T')[0]
    const isToday = currentDate.toDateString() === new Date().toDateString()
    const dateDisplayTitle = isToday ? 'Hôm nay' : currentDate.toLocaleDateString('vi-VN', { weekday: 'long' })
    const dateDisplaySub = currentDate.toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric', year: 'numeric' })

    const handlePrevDay = () => {
        const prev = new Date(currentDate)
        prev.setDate(prev.getDate() - 1)
        setCurrentDate(prev)
    }

    const handleNextDay = () => {
        const next = new Date(currentDate)
        next.setDate(next.getDate() + 1)
        setCurrentDate(next)
    }

    const toast = useToast()
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

    // Modal state for logging food from DB
    const [isLogModalOpen, setIsLogModalOpen] = useState(false)
    const [targetMealSection, setTargetMealSection] = useState<MealTypeSection>('Breakfast')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL')
    const [loggingFoodId, setLoggingFoodId] = useState<number | null>(null)

    // SWR Key with workoutCalories param if available
    const swrKey = isAuthenticated
        ? `/nutrition/daily?date=${dateStr}${workoutCaloriesParam ? `&caloriesBurned=${workoutCaloriesParam}` : ''}`
        : null

    // Fetch daily summary from backend
    const { data: summary } = useSWR<DailyNutritionSummary>(swrKey, fetcher)

    // Fetch full food library from DB
    const { data: dbFoods } = useSWR<RecommendedFood[]>(
        isAuthenticated ? '/foods' : null,
        fetcher
    )

    // Meal items state for all 4 meals
    const [breakfastItems, setBreakfastItems] = useState<MealItemData[]>([])
    const [lunchItems, setLunchItems] = useState<MealItemData[]>([])
    const [dinnerItems, setDinnerItems] = useState<MealItemData[]>([])
    const [snackItems, setSnackItems] = useState<MealItemData[]>([])

    // Load persisted meals for date, or seed sensible defaults from DB
    React.useEffect(() => {
        try {
            const savedB = localStorage.getItem(`netfit_bf_${dateStr}`)
            const savedL = localStorage.getItem(`netfit_ln_${dateStr}`)
            const savedD = localStorage.getItem(`netfit_dn_${dateStr}`)
            const savedS = localStorage.getItem(`netfit_sn_${dateStr}`)

            if (savedB) {
                setBreakfastItems(JSON.parse(savedB))
            } else if (dbFoods && dbFoods.length > 0) {
                const oats = dbFoods.find((f) => f.id === 3) || dbFoods.find((f) => f.name.toLowerCase().includes('oat'))
                if (oats) {
                    setBreakfastItems([
                        {
                            id: oats.id,
                            name: oats.name,
                            serving: `${oats.servingSize || '100'} ${oats.unit || 'g'}`,
                            calories: oats.calories,
                            protein: Number(oats.protein),
                            carbs: Number(oats.carbs),
                            fat: Number(oats.fat),
                            imageUrl: getFoodImage(oats),
                        },
                    ])
                }
            } else {
                setBreakfastItems([])
            }

            if (savedL) {
                setLunchItems(JSON.parse(savedL))
            } else if (dbFoods && dbFoods.length > 0) {
                const chicken = dbFoods.find((f) => f.id === 6) || dbFoods.find((f) => f.name.toLowerCase().includes('chicken'))
                if (chicken) {
                    setLunchItems([
                        {
                            id: chicken.id,
                            name: chicken.name,
                            serving: `${chicken.servingSize || '100'} ${chicken.unit || 'g'}`,
                            calories: chicken.calories,
                            protein: Number(chicken.protein),
                            carbs: Number(chicken.carbs),
                            fat: Number(chicken.fat),
                            imageUrl: getFoodImage(chicken),
                        },
                    ])
                }
            } else {
                setLunchItems([])
            }

            if (savedD) {
                setDinnerItems(JSON.parse(savedD))
            } else {
                setDinnerItems([])
            }

            if (savedS) {
                setSnackItems(JSON.parse(savedS))
            } else {
                setSnackItems([])
            }
        } catch {
            // ignore JSON error
        }
    }, [dateStr, dbFoods])

    // Burned calories from workout or summary
    const burnedKcal = Number(summary?.caloriesBurned ?? (workoutCaloriesParam || 0))
    const recovery = summary?.workoutRecovery
    const recoveryCombos = recovery?.suggestedCombos ?? []

    // Combo selection state
    const [selectedComboIdx, setSelectedComboIdx] = useState<number>(0)
    const [addedRecoveryFoodIds, setAddedRecoveryFoodIds] = useState<number[]>([])
    const [isApplyingFullDay, setIsApplyingFullDay] = useState(false)

    // Active combo from DB recovery
    const activeCombo: SuggestedRecoveryCombo | undefined = recoveryCombos[selectedComboIdx] || recoveryCombos[0]

    // Calories: Real values from DB/API - Targets are active only when user has worked out (burnedKcal > 0)
    const caloriesConsumed = summary?.caloriesConsumed ?? 0
    const caloriesTarget = burnedKcal > 0 ? (summary?.caloriesTarget ?? 0) : 0
    const netCalories = summary?.netCalories ?? (caloriesConsumed - burnedKcal)
    const caloriesRemaining = burnedKcal > 0 ? (summary?.caloriesRemaining ?? Math.max(0, caloriesTarget - netCalories)) : 0

    // Macros: Targets are active only when user has worked out (burnedKcal > 0)
    const proteinCurrent = summary?.protein ? Number(summary.protein.currentGrams) : 0
    const proteinTarget = burnedKcal > 0 ? (summary?.protein ? Number(summary.protein.targetGrams) : 0) : 0

    const carbsCurrent = summary?.carbs ? Number(summary.carbs.currentGrams) : 0
    const carbsTarget = burnedKcal > 0 ? (summary?.carbs ? Number(summary.carbs.targetGrams) : 0) : 0

    const fatCurrent = summary?.fat ? Number(summary.fat.currentGrams) : 0
    const fatTarget = burnedKcal > 0 ? (summary?.fat ? Number(summary.fat.targetGrams) : 0) : 0

    // Hydration: Real glasses from DB/API
    const waterCurrent = summary?.waterConsumedGlasses ?? 0
    const waterTotal = summary?.waterTargetGlasses ?? 8

    // Handler to log water
    const handleLogGlass = async (glassIndex: number) => {
        try {
            await logWater(dateStr, 1)
            globalMutate(swrKey)
            toast({
                title: 'Đã uống 1 ly nước! 🥛',
                description: `Ly #${glassIndex + 1} đã được ghi nhận.`,
                status: 'success',
                duration: 2000,
                isClosable: true,
            })
        } catch {
            toast({
                title: 'Không thể ghi nhận nước uống',
                status: 'error',
                duration: 2000,
                isClosable: true,
            })
        }
    }

    // Helper to add food item to specified meal state & local storage
    const addItemToSection = (targetSection: MealTypeSection, newItem: MealItemData) => {
        if (targetSection === 'Breakfast') {
            setBreakfastItems((prev) => {
                const updated = [...prev, newItem]
                localStorage.setItem(`netfit_bf_${dateStr}`, JSON.stringify(updated))
                return updated
            })
        } else if (targetSection === 'Lunch') {
            setLunchItems((prev) => {
                const updated = [...prev, newItem]
                localStorage.setItem(`netfit_ln_${dateStr}`, JSON.stringify(updated))
                return updated
            })
        } else if (targetSection === 'Dinner') {
            setDinnerItems((prev) => {
                const updated = [...prev, newItem]
                localStorage.setItem(`netfit_dn_${dateStr}`, JSON.stringify(updated))
                return updated
            })
        } else {
            setSnackItems((prev) => {
                const updated = [...prev, newItem]
                localStorage.setItem(`netfit_sn_${dateStr}`, JSON.stringify(updated))
                return updated
            })
        }
    }

    // Handler to log an individual food item into meals
    const handleAddFoodToMeal = async (food: RecommendedFood, section: MealTypeSection = 'Lunch') => {
        try {
            await logFood(dateStr, food.id, 1)
            await globalMutate(swrKey)

            setAddedRecoveryFoodIds((prev) => [...prev, food.id])

            const newItem: MealItemData = {
                id: food.id,
                name: food.name,
                serving: `${food.servingSize || '100'} ${food.unit || 'g'}`,
                calories: food.calories,
                protein: Number(food.protein),
                carbs: Number(food.carbs),
                fat: Number(food.fat),
                imageUrl: getFoodImage(food),
            }

            addItemToSection(section, newItem)

            toast({
                title: 'Đã thêm món vào bữa ăn! 🍽️',
                description: `${food.name} (${food.calories} kcal) đã được ghi vào ${section}.`,
                status: 'success',
                duration: 2500,
                isClosable: true,
            })
        } catch {
            toast({
                title: 'Không thể ghi nhận món ăn',
                status: 'error',
                duration: 2500,
                isClosable: true,
            })
        }
    }

    // Handler to apply entire menu combo to a meal section
    const handleApplyComboToMeal = async (combo: SuggestedRecoveryCombo, section: MealTypeSection) => {
        try {
            for (const food of combo.foods) {
                await logFood(dateStr, food.id, 1)
                const newItem: MealItemData = {
                    id: food.id,
                    name: food.name,
                    serving: `${food.servingSize || '100'} ${food.unit || 'g'}`,
                    calories: food.calories,
                    protein: Number(food.protein),
                    carbs: Number(food.carbs),
                    fat: Number(food.fat),
                    imageUrl: getFoodImage(food),
                }
                addItemToSection(section, newItem)
            }
            await globalMutate(swrKey)
            setAddedRecoveryFoodIds((prev) => [...prev, ...combo.foods.map((f) => f.id)])

            toast({
                title: `Đã nạp thực đơn vào ${section}! 🎉`,
                description: `${combo.title} (${combo.totalCalories} kcal) đã được lưu vào nhật ký.`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            })
        } catch {
            toast({
                title: 'Không thể áp dụng thực đơn',
                status: 'error',
                duration: 2500,
                isClosable: true,
            })
        }
    }

    // Handler to apply full day menu combo across all 4 meal sections at once
    const handleApplyFullDayCombo = async (combo: SuggestedRecoveryCombo) => {
        setIsApplyingFullDay(true)
        try {
            if (combo.meals && combo.meals.length > 0) {
                for (const section of combo.meals) {
                    const targetSec = (section.mealType as MealTypeSection) || 'Lunch'
                    for (const food of section.foods) {
                        await logFood(dateStr, food.id, 1)
                        const newItem: MealItemData = {
                            id: food.id,
                            name: food.name,
                            serving: `${food.servingSize || '100'} ${food.unit || 'g'}`,
                            calories: food.calories,
                            protein: Number(food.protein),
                            carbs: Number(food.carbs),
                            fat: Number(food.fat),
                            imageUrl: getFoodImage(food),
                        }
                        addItemToSection(targetSec, newItem)
                    }
                }
            } else {
                for (const food of combo.foods) {
                    await logFood(dateStr, food.id, 1)
                    const newItem: MealItemData = {
                        id: food.id,
                        name: food.name,
                        serving: `${food.servingSize || '100'} ${food.unit || 'g'}`,
                        calories: food.calories,
                        protein: Number(food.protein),
                        carbs: Number(food.carbs),
                        fat: Number(food.fat),
                        imageUrl: getFoodImage(food),
                    }
                    addItemToSection('Lunch', newItem)
                }
            }

            await globalMutate(swrKey)
            const allIds = combo.foods.map((f) => f.id)
            setAddedRecoveryFoodIds((prev) => [...prev, ...allIds])

            toast({
                title: 'Đã nạp toàn bộ thực đơn cả ngày! 🎉',
                description: `${combo.title} (${combo.totalCalories} kcal) đã được phân bổ vào các bữa Sáng, Trưa, Tối, Phụ.`,
                status: 'success',
                duration: 4000,
                isClosable: true,
            })
        } catch {
            toast({
                title: 'Không thể nạp toàn bộ thực đơn',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        } finally {
            setIsApplyingFullDay(false)
        }
    }

    // Remove item from a meal section
    const handleRemoveItem = (section: MealTypeSection, index: number) => {
        if (section === 'Breakfast') {
            setBreakfastItems((prev) => {
                const updated = prev.filter((_, i) => i !== index)
                localStorage.setItem(`netfit_bf_${dateStr}`, JSON.stringify(updated))
                return updated
            })
        } else if (section === 'Lunch') {
            setLunchItems((prev) => {
                const updated = prev.filter((_, i) => i !== index)
                localStorage.setItem(`netfit_ln_${dateStr}`, JSON.stringify(updated))
                return updated
            })
        } else if (section === 'Dinner') {
            setDinnerItems((prev) => {
                const updated = prev.filter((_, i) => i !== index)
                localStorage.setItem(`netfit_dn_${dateStr}`, JSON.stringify(updated))
                return updated
            })
        } else {
            setSnackItems((prev) => {
                const updated = prev.filter((_, i) => i !== index)
                localStorage.setItem(`netfit_sn_${dateStr}`, JSON.stringify(updated))
                return updated
            })
        }
    }

    // Handler to log a food from DB modal
    const handleSelectFoodFromModal = async (food: RecommendedFood) => {
        setLoggingFoodId(food.id)
        try {
            await logFood(dateStr, food.id, 1)
            await globalMutate(swrKey)

            const newItem: MealItemData = {
                id: food.id,
                name: food.name,
                serving: `${food.servingSize || '1'} ${food.unit || 'khẩu phần'}`,
                calories: food.calories,
                protein: Number(food.protein),
                carbs: Number(food.carbs),
                fat: Number(food.fat),
                imageUrl: getFoodImage(food),
            }

            addItemToSection(targetMealSection, newItem)

            toast({
                title: 'Món ăn đã được thêm! 🥑',
                description: `${food.name} đã được lưu vào ${targetMealSection}.`,
                status: 'success',
                duration: 2000,
                isClosable: true,
            })
            setIsLogModalOpen(false)
        } catch {
            toast({
                title: 'Không thể ghi nhận món ăn',
                status: 'error',
                duration: 2000,
                isClosable: true,
            })
        } finally {
            setLoggingFoodId(null)
        }
    }

    // Filter DB foods in modal
    const filteredDbFoods = (dbFoods || []).filter((f) => {
        const matchesQuery = f.name.toLowerCase().includes(searchQuery.toLowerCase())
        if (selectedCategoryFilter === 'ALL') return matchesQuery
        return matchesQuery && f.category === selectedCategoryFilter
    })

    // Calculate total meal calories purely from logged items
    const breakfastKcal = breakfastItems.reduce((sum, item) => sum + item.calories, 0)
    const lunchKcal = lunchItems.reduce((sum, item) => sum + item.calories, 0)
    const dinnerKcal = dinnerItems.reduce((sum, item) => sum + item.calories, 0)
    const snackKcal = snackItems.reduce((sum, item) => sum + item.calories, 0)

    return (
        <MemberLayout>
            <Box p={{ base: '4', md: '7' }} maxW="1200px" w="full" minW="0" mx="auto">
                {/* ── Top Header ─────────────────────── */}
                <Flex align="center" justify="space-between" mb="6" flexWrap="wrap" gap="4">
                    <HStack spacing="3">
                        <IconButton
                            aria-label="Previous day"
                            icon={<Icon as={FiChevronLeft} boxSize="18px" />}
                            variant="ghost"
                            size="sm"
                            w="36px"
                            h="36px"
                            borderRadius="full"
                            bg="#141720"
                            border="1px solid"
                            borderColor="#1e2028"
                            color="#8A8A93"
                            _hover={{ bg: '#1e2028', color: 'white' }}
                            onClick={handlePrevDay}
                        />
                        <Box>
                            <Heading fontSize="22px" fontWeight="800" color="white" lineHeight="1.2">
                                {dateDisplayTitle}
                            </Heading>
                            <Text fontSize="12px" color="#8A8A93" fontWeight="500">
                                {dateDisplaySub}
                            </Text>
                        </Box>
                        <IconButton
                            aria-label="Next day"
                            icon={<Icon as={FiChevronRight} boxSize="18px" />}
                            variant="ghost"
                            size="sm"
                            w="36px"
                            h="36px"
                            borderRadius="full"
                            bg="#141720"
                            border="1px solid"
                            borderColor="#1e2028"
                            color="#8A8A93"
                            _hover={{ bg: '#1e2028', color: 'white' }}
                            onClick={handleNextDay}
                        />
                    </HStack>

                    <Button
                        bg="#E03030"
                        _hover={{ bg: '#ff3d3d' }}
                        color="white"
                        borderRadius="full"
                        px="6"
                        h="40px"
                        fontSize="14px"
                        fontWeight="700"
                        leftIcon={<Icon as={FiPlus} />}
                        onClick={() => {
                            setTargetMealSection('Breakfast')
                            setIsLogModalOpen(true)
                        }}
                    >
                        Thêm Món Ăn Từ DB
                    </Button>
                </Flex>

                {/* ── Workout Recovery & Nutrition Need Banner (Hiển thị khi có dữ liệu calo từ buổi tập) ─── */}
                {burnedKcal > 0 && (
                    <Box
                        bg="linear-gradient(135deg, rgba(224, 48, 48, 0.12) 0%, rgba(20, 23, 32, 0.95) 100%)"
                        border="1px solid"
                        borderColor="rgba(224, 48, 48, 0.35)"
                        borderRadius="20px"
                        p="5"
                        mb="8"
                        position="relative"
                        overflow="hidden"
                    >
                        <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap="4" mb="4">
                            <Box>
                                <HStack spacing="2" mb="1.5">
                                    <Badge bg="#E03030" color="white" px="3" py="0.5" borderRadius="full" fontSize="11px" fontWeight="800">
                                        ✦ GỢI Ý DINH DƯỠNG THEO CALORIES TẬP LUYỆN
                                    </Badge>
                                    <HStack spacing="1" bg="rgba(224,48,48,0.15)" px="2.5" py="0.5" borderRadius="full">
                                        <Icon as={FiTrendingUp} color="#F27A7A" boxSize="13px" />
                                        <Text fontSize="12px" color="#F27A7A" fontWeight="800">
                                            {burnedKcal} kcal đã đốt cháy
                                        </Text>
                                    </HStack>
                                </HStack>
                                <Text fontSize="13px" color="#C4C4CC" maxW="780px" lineHeight="1.6">
                                    {recovery?.guidanceMessage ||
                                        'Dựa trên lượng calories đã tiêu hao từ buổi tập, cơ thể bạn cần được nạp lại năng lượng phục hồi và chuỗi axit amin thiết yếu trong 30-60 phút để sửa chữa sợi cơ và tái tạo glycogen.'}
                                </Text>
                            </Box>

                            <Box bg="#0A0C10" px="4" py="2.5" borderRadius="14px" border="1px solid #232733" textAlign={{ base: 'left', md: 'right' }} flexShrink={0}>
                                <Text fontSize="11px" color="#8A8A93" fontWeight="600" textTransform="uppercase">
                                    Calo Cần Bù Đắp Sau Tập
                                </Text>
                                <Text fontSize="22px" fontWeight="900" color="#E03030" lineHeight="1.1" mt="1">
                                    ~{recovery?.recommendedReplenishCalories || Math.round(burnedKcal * 0.5)} kcal
                                </Text>
                                <Text fontSize="10px" color="#8A8A93" mt="0.5">
                                    (Khoảng 50% lượng calo tiêu hao)
                                </Text>
                            </Box>
                        </Flex>

                        {/* Dưỡng chất cần bổ sung cụ thể */}
                        {recovery?.nutrientsToReplenish && recovery.nutrientsToReplenish.length > 0 && (
                            <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }} gap="3" pt="3" borderTop="1px solid rgba(255,255,255,0.08)">
                                {recovery.nutrientsToReplenish.map((item, idx) => (
                                    <Box key={idx} bg="#0E1118" p="3.5" borderRadius="14px" border="1px solid #1e2028">
                                        <Flex justify="space-between" align="center" mb="1">
                                            <Text fontSize="12px" fontWeight="700" color="white" noOfLines={1}>
                                                {item.nutrient.split('(')[0].trim()}
                                            </Text>
                                            <Badge bg={item.priority === 'Cao' ? 'rgba(224,48,48,0.2)' : 'rgba(255,255,255,0.08)'} color={item.priority === 'Cao' ? '#F27A7A' : '#8A8A93'} fontSize="9px" px="1.5" borderRadius="4px">
                                                {item.priority}
                                            </Badge>
                                        </Flex>
                                        <Text fontSize="16px" fontWeight="900" color="#E03030">
                                            {item.targetAmount}
                                        </Text>
                                        <Text fontSize="11px" color="#8A8A93" noOfLines={2} mt="1" lineHeight="1.4">
                                            {item.purpose}
                                        </Text>
                                        {item.bestFoodSources && (
                                            <Text fontSize="10px" color="#4FD1C5" fontWeight="600" mt="2" noOfLines={1}>
                                                Nguồn DB: {item.bestFoodSources}
                                            </Text>
                                        )}
                                    </Box>
                                ))}
                            </Grid>
                        )}
                    </Box>
                )}

                {/* ── Calorie & Macro Cards Row (Top Section) ─── */}
                <Grid templateColumns={{ base: '1fr', lg: '320px 1fr 1fr 1fr' }} gap="4" mb="8">
                    {/* Calories Card */}
                    <Box
                        bg="#141720"
                        border="1px solid"
                        borderColor="#1e2028"
                        borderRadius="20px"
                        p="5"
                        display="flex"
                        flexDirection="column"
                        justifyContent="space-between"
                    >
                        <Flex justify="space-between" align="center">
                            <Text fontSize="15px" fontWeight="700" color="white">
                                Tổng Calo Trong Ngày
                            </Text>
                            {caloriesTarget > 0 && (
                                <Badge bg="rgba(255,255,255,0.06)" color="#8A8A93" fontSize="10px" px="2" py="0.5" borderRadius="full">
                                    Mục tiêu TDEE: {caloriesTarget.toLocaleString()} kcal
                                </Badge>
                            )}
                        </Flex>

                        <CaloriesDonut current={caloriesConsumed} total={caloriesTarget} />

                        <Box textAlign="center" mt="2">
                            <Text fontSize="12px" color="#8A8A93">
                                Còn lại cần nạp: <Text as="span" color="white" fontWeight="700">{caloriesRemaining.toLocaleString()} kcal</Text>
                            </Text>
                            {burnedKcal > 0 ? (
                                <Text fontSize="11px" color="#F27A7A" fontWeight="600" mt="0.5">
                                    Đã nạp: {caloriesConsumed.toLocaleString()} kcal • Đốt cháy: -{burnedKcal} kcal • Net: {netCalories.toLocaleString()} kcal
                                </Text>
                            ) : (
                                <Text fontSize="11px" color="#8A8A93" mt="0.5">
                                    Chưa có buổi tập hôm nay
                                </Text>
                            )}
                        </Box>
                    </Box>

                    {/* Protein Card */}
                    <MacroMetricCard
                        title="Chất Đạm (Protein)"
                        current={proteinCurrent}
                        target={proteinTarget}
                        barColor="#E03030"
                        icon={<Icon as={FiZap} boxSize="12px" />}
                    />

                    {/* Carbs Card */}
                    <MacroMetricCard
                        title="Tinh Bột (Carbs)"
                        current={carbsCurrent}
                        target={carbsTarget}
                        barColor="#C4C4CC"
                        icon={<Icon as={FiActivity} boxSize="12px" />}
                    />

                    {/* Fat Card */}
                    <MacroMetricCard
                        title="Chất Béo (Fat)"
                        current={fatCurrent}
                        target={fatTarget}
                        barColor="#F27A7A"
                        icon={<Icon as={FiDroplet} boxSize="12px" />}
                    />
                </Grid>

                {/* Ghi chú khi người dùng chưa có buổi tập nào trong ngày */}
                {burnedKcal === 0 && (
                    <Box bg="#141720" border="1px dashed #2e3040" borderRadius="16px" p="4" mb="8" textAlign="center">
                        <Text fontSize="13px" color="#8A8A93">
                            💡 <b>Chưa có buổi tập hôm nay:</b> Các chỉ số calo & macro mục tiêu sẽ được kích hoạt cùng các gợi ý combo thực đơn cho các bữa ăn ngay khi bạn hoàn thành buổi tập!
                        </Text>
                    </Box>
                )}

                {/* ════════════════════════════════════════════════════════════════
                    KHU VỰC CHÍNH: GỢI Ý THỰC ĐƠN COMBO (CHỈ HIỂN THỊ KHI ĐÃ TẬP XONG burnedKcal > 0)
                   ════════════════════════════════════════════════════════════════ */}
                {burnedKcal > 0 && recoveryCombos.length > 0 && (
                    <Box
                        bg="#141720"
                        border="1px solid"
                        borderColor="#1e2028"
                        borderRadius="20px"
                        p={{ base: '4', md: '6' }}
                        mb="8"
                    >
                        <Flex justify="space-between" align={{ base: 'flex-start', sm: 'center' }} direction={{ base: 'column', sm: 'row' }} gap="3" mb="5">
                            <Box>
                                <HStack spacing="2">
                                    <Icon as={FiLayers} color="#E03030" boxSize="18px" />
                                    <Heading fontSize="18px" fontWeight="800" color="white">
                                        Gợi Ý Combo Thực Đơn Theo Buổi Tập
                                    </Heading>
                                </HStack>
                                <Text fontSize="12px" color="#8A8A93" mt="1">
                                    Các combo dinh dưỡng đầy đủ cho tất cả các buổi (Sáng, Trưa, Tối, Phụ) đáp ứng calo và tỷ lệ Macro cần nạp
                                </Text>
                            </Box>

                            {/* Combo switcher buttons */}
                            <HStack spacing="2" overflowX="auto" maxW="full" py="1">
                                {recoveryCombos.map((combo, idx) => (
                                    <Button
                                        key={idx}
                                        size="sm"
                                        h="32px"
                                        px="3.5"
                                        borderRadius="full"
                                        fontSize="12px"
                                        fontWeight="700"
                                        bg={selectedComboIdx === idx ? '#E03030' : '#1e2028'}
                                        color={selectedComboIdx === idx ? 'white' : '#8A8A93'}
                                        _hover={{ bg: selectedComboIdx === idx ? '#ff3d3d' : '#2e3040', color: 'white' }}
                                        onClick={() => setSelectedComboIdx(idx)}
                                    >
                                        {combo.title.split(':')[0] || `Combo ${idx + 1}`} ({combo.totalCalories} kcal)
                                    </Button>
                                ))}
                            </HStack>
                        </Flex>

                    {/* Active Combo Showcase Card */}
                    {activeCombo && (
                        <Box bg="#0B0D13" border="1px solid #1e2028" borderRadius="18px" p={{ base: '4', md: '5' }}>
                            <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap="4" mb="4">
                                <Box flex="1">
                                    <HStack spacing="2" mb="1">
                                        <Badge bg="#1e2028" color="#4FD1C5" px="2.5" py="0.5" borderRadius="full" fontSize="10px" fontWeight="700">
                                            {activeCombo.targetGoal || 'Thực đơn cả ngày'}
                                        </Badge>
                                        <Badge bg="rgba(224,48,48,0.15)" color="#E03030" px="2.5" py="0.5" borderRadius="full" fontSize="10px" fontWeight="700">
                                            Đầy đủ 4 bữa (Sáng, Trưa, Tối, Phụ)
                                        </Badge>
                                    </HStack>
                                    <Heading fontSize="17px" fontWeight="800" color="white">
                                        {activeCombo.title}
                                    </Heading>
                                    <Text fontSize="12px" color="#8A8A93" mt="1" maxW="700px" lineHeight="1.5">
                                        {activeCombo.description}
                                    </Text>
                                </Box>

                                {/* Combo Macro Overview & Action */}
                                <Flex align="center" gap="3" flexWrap="wrap">
                                    <HStack spacing="3" bg="#141720" px="4" py="2" borderRadius="12px" border="1px solid #232733">
                                        <Box textAlign="center">
                                            <Text fontSize="10px" color="#8A8A93" fontWeight="700">CALO</Text>
                                            <Text fontSize="15px" fontWeight="800" color="#E03030">{activeCombo.totalCalories} kcal</Text>
                                        </Box>
                                        <Box w="1px" h="24px" bg="#232733" />
                                        <Box textAlign="center">
                                            <Text fontSize="10px" color="#8A8A93" fontWeight="700">PRO</Text>
                                            <Text fontSize="13px" fontWeight="700" color="white">{activeCombo.totalProtein}g</Text>
                                        </Box>
                                        <Box textAlign="center">
                                            <Text fontSize="10px" color="#8A8A93" fontWeight="700">CARB</Text>
                                            <Text fontSize="13px" fontWeight="700" color="white">{activeCombo.totalCarbs}g</Text>
                                        </Box>
                                        <Box textAlign="center">
                                            <Text fontSize="10px" color="#8A8A93" fontWeight="700">FAT</Text>
                                            <Text fontSize="13px" fontWeight="700" color="white">{activeCombo.totalFat}g</Text>
                                        </Box>
                                    </HStack>

                                    {/* Primary Button: Nạp Cả Thực Đơn Cả Ngày */}
                                    <Button
                                        bg="#E03030"
                                        _hover={{ bg: '#ff3d3d' }}
                                        color="white"
                                        borderRadius="full"
                                        h="38px"
                                        px="5"
                                        fontSize="13px"
                                        fontWeight="700"
                                        leftIcon={<Icon as={FiCheckCircle} />}
                                        isLoading={isApplyingFullDay}
                                        loadingText="Đang nạp thực đơn..."
                                        onClick={() => handleApplyFullDayCombo(activeCombo)}
                                    >
                                        Nạp Cả Thực Đơn Cả Ngày
                                    </Button>
                                </Flex>
                            </Flex>

                            {/* Food items inside active combo: Full Day 4-Meal Breakdown */}
                            {activeCombo.meals && activeCombo.meals.length > 0 ? (
                                <Stack spacing="4" mt="4">
                                    {activeCombo.meals.map((mealSec, sIdx) => (
                                        <Box key={sIdx} bg="#141720" border="1px solid #1e2028" borderRadius="14px" p="4">
                                            <Flex justify="space-between" align="center" mb="3" flexWrap="wrap" gap="2">
                                                <HStack spacing="2">
                                                    <Badge
                                                        bg={
                                                            mealSec.mealType === 'Breakfast'
                                                                ? 'rgba(237, 137, 54, 0.2)'
                                                                : mealSec.mealType === 'Lunch'
                                                                ? 'rgba(79, 209, 197, 0.2)'
                                                                : mealSec.mealType === 'Dinner'
                                                                ? 'rgba(159, 122, 234, 0.2)'
                                                                : 'rgba(224, 48, 48, 0.2)'
                                                        }
                                                        color={
                                                            mealSec.mealType === 'Breakfast'
                                                                ? '#ED8936'
                                                                : mealSec.mealType === 'Lunch'
                                                                ? '#4FD1C5'
                                                                : mealSec.mealType === 'Dinner'
                                                                ? '#B794F4'
                                                                : '#F27A7A'
                                                        }
                                                        px="2.5"
                                                        py="0.5"
                                                        borderRadius="full"
                                                        fontSize="11px"
                                                        fontWeight="800"
                                                    >
                                                        {mealSec.mealType === 'Breakfast'
                                                            ? '🌅 BỮA SÁNG'
                                                            : mealSec.mealType === 'Lunch'
                                                            ? '☀️ BỮA TRƯA'
                                                            : mealSec.mealType === 'Dinner'
                                                            ? '🌙 BỮA TỐI'
                                                            : '⚡ BỮA PHỤ SAU TẬP'}
                                                    </Badge>
                                                    <Text fontSize="13px" fontWeight="700" color="white">
                                                        {mealSec.mealTitle}
                                                    </Text>
                                                </HStack>

                                                <HStack spacing="3">
                                                    <Text fontSize="12px" color="#8A8A93">
                                                        <Text as="span" color="#F27A7A" fontWeight="700">{mealSec.calories} kcal</Text> • {mealSec.protein}g Đạm • {mealSec.carbs}g Carb • {mealSec.fat}g Béo
                                                    </Text>
                                                    <Button
                                                        size="xs"
                                                        variant="ghost"
                                                        color="#E03030"
                                                        _hover={{ bg: 'rgba(224,48,48,0.1)' }}
                                                        onClick={() =>
                                                            handleApplyComboToMeal(
                                                                {
                                                                    ...activeCombo,
                                                                    foods: mealSec.foods,
                                                                    totalCalories: mealSec.calories,
                                                                },
                                                                mealSec.mealType as MealTypeSection
                                                            )
                                                        }
                                                    >
                                                        + Nạp riêng bữa này
                                                    </Button>
                                                </HStack>
                                            </Flex>

                                            <Grid templateColumns={{ base: '1fr', md: 'repeat(auto-fit, minmax(260px, 1fr))' }} gap="3">
                                                {mealSec.foods.map((food) => {
                                                    const isAdded = addedRecoveryFoodIds.includes(food.id)
                                                    return (
                                                        <Flex
                                                            key={food.id}
                                                            bg="#0B0D13"
                                                            border="1px solid #1e2028"
                                                            borderRadius="10px"
                                                            p="2.5"
                                                            align="center"
                                                            justify="space-between"
                                                            gap="2.5"
                                                        >
                                                            <HStack spacing="2.5" minW="0" flex="1">
                                                                <Box w="42px" h="42px" borderRadius="8px" overflow="hidden" flexShrink={0} bg="#1a1d26">
                                                                    <Image src={getFoodImage(food)} alt={food.name} w="full" h="full" objectFit="cover" />
                                                                </Box>
                                                                <Box minW="0">
                                                                    <Text fontSize="13px" fontWeight="700" color="white" noOfLines={1}>
                                                                        {food.name}
                                                                    </Text>
                                                                    <Text fontSize="11px" color="#8A8A93">
                                                                        {food.servingSize || '100'} {food.unit || 'g'} • <Text as="span" color="#F27A7A" fontWeight="600">{food.calories} kcal</Text>
                                                                    </Text>
                                                                </Box>
                                                            </HStack>

                                                            <IconButton
                                                                aria-label="Add food"
                                                                icon={<Icon as={isAdded ? FiCheck : FiPlus} boxSize="13px" />}
                                                                size="xs"
                                                                borderRadius="full"
                                                                variant={isAdded ? 'solid' : 'outline'}
                                                                colorScheme={isAdded ? 'green' : 'gray'}
                                                                onClick={() => handleAddFoodToMeal(food, mealSec.mealType as MealTypeSection)}
                                                            />
                                                        </Flex>
                                                    )
                                                })}
                                            </Grid>
                                        </Box>
                                    ))}
                                </Stack>
                            ) : (
                                <Grid templateColumns={{ base: '1fr', md: 'repeat(auto-fit, minmax(280px, 1fr))' }} gap="3.5" mt="4">
                                    {activeCombo.foods.map((food) => {
                                        const isAdded = addedRecoveryFoodIds.includes(food.id)
                                        return (
                                            <Box
                                                key={food.id}
                                                bg="#141720"
                                                border="1px solid"
                                                borderColor="#1e2028"
                                                borderRadius="14px"
                                                p="3.5"
                                                display="flex"
                                                flexDirection="column"
                                                justifyContent="space-between"
                                                transition="all 0.2s"
                                                _hover={{ borderColor: '#2e3040', transform: 'translateY(-2px)' }}
                                            >
                                                <Flex gap="3" align="start">
                                                    <Box w="60px" h="60px" borderRadius="10px" overflow="hidden" bg="#1a1d26" flexShrink={0} border="1px solid #232733">
                                                        <Image
                                                            src={getFoodImage(food)}
                                                            alt={food.name}
                                                            w="full"
                                                            h="full"
                                                            objectFit="cover"
                                                        />
                                                    </Box>
                                                    <Box minW="0" flex="1">
                                                        <HStack spacing="1.5" mb="0.5">
                                                            <Badge
                                                                bg={food.category === 'Protein' ? 'rgba(224,48,48,0.2)' : food.category === 'Carbs' ? 'rgba(79,209,197,0.2)' : 'rgba(246,173,85,0.2)'}
                                                                color={food.category === 'Protein' ? '#F27A7A' : food.category === 'Carbs' ? '#4FD1C5' : '#F6AD55'}
                                                                fontSize="9px"
                                                                px="1.5"
                                                                borderRadius="4px"
                                                            >
                                                                {food.categoryLabel || food.category}
                                                            </Badge>
                                                        </HStack>
                                                        <Text fontSize="14px" fontWeight="700" color="white" noOfLines={1}>
                                                            {food.name}
                                                        </Text>
                                                        <Text fontSize="11px" color="#8A8A93">
                                                            {food.servingSize || '100'} {food.unit || 'g'} • <Text as="span" color="#F27A7A" fontWeight="600">{food.calories} kcal</Text>
                                                        </Text>
                                                    </Box>
                                                </Flex>

                                                <Text fontSize="11px" color="#A0AEC0" mt="2.5" mb="3" noOfLines={2} lineHeight="1.4">
                                                    {food.recoveryBenefit || 'Bổ sung dinh dưỡng tối ưu cho quá trình phục hồi cơ thể.'}
                                                </Text>

                                                <Flex justify="space-between" align="center" pt="2" borderTop="1px solid #1e2028">
                                                    <HStack spacing="2" fontSize="10px" color="#8A8A93" fontWeight="600">
                                                        <Text>{food.protein}g Đạm</Text>
                                                        <Text>•</Text>
                                                        <Text>{food.carbs}g Carbs</Text>
                                                        <Text>•</Text>
                                                        <Text>{food.fat}g Béo</Text>
                                                    </HStack>

                                                    <Menu>
                                                        <MenuButton
                                                            as={Button}
                                                            size="xs"
                                                            variant="outline"
                                                            borderColor={isAdded ? '#38A169' : '#2e3040'}
                                                            color={isAdded ? '#38A169' : 'white'}
                                                            borderRadius="full"
                                                            px="2.5"
                                                            leftIcon={<Icon as={isAdded ? FiCheck : FiPlus} boxSize="11px" />}
                                                        >
                                                            {isAdded ? 'Đã thêm' : '+ Nạp món'}
                                                        </MenuButton>
                                                        <MenuList bg="#141720" borderColor="#2e3040" color="white" fontSize="12px">
                                                            <MenuItem bg="#141720" _hover={{ bg: '#1e2028' }} onClick={() => handleAddFoodToMeal(food, 'Breakfast')}>
                                                                Vào Bữa Sáng
                                                            </MenuItem>
                                                            <MenuItem bg="#141720" _hover={{ bg: '#1e2028' }} onClick={() => handleAddFoodToMeal(food, 'Lunch')}>
                                                                Vào Bữa Trưa
                                                            </MenuItem>
                                                            <MenuItem bg="#141720" _hover={{ bg: '#1e2028' }} onClick={() => handleAddFoodToMeal(food, 'Dinner')}>
                                                                Vào Bữa Tối
                                                            </MenuItem>
                                                            <MenuItem bg="#141720" _hover={{ bg: '#1e2028' }} onClick={() => handleAddFoodToMeal(food, 'Snack')}>
                                                                Vào Bữa Phụ / Sau tập
                                                            </MenuItem>
                                                        </MenuList>
                                                    </Menu>
                                                </Flex>
                                            </Box>
                                        )
                                    })}
                                </Grid>
                            )}
                        </Box>
                    )}
                </Box>
                )}

                {/* ── Lower Two-Column Section (Daily Meals & Hydration) ─── */}
                <Grid templateColumns={{ base: '1fr', lg: '1fr 340px' }} gap="6" alignItems="start">
                    {/* ── Left Column: 4 Meals of the Day ────────────── */}
                    <Stack spacing="6">
                        {/* Breakfast Section */}
                        <Box>
                            <Flex justify="space-between" align="center" mb="3">
                                <HStack spacing="2.5">
                                    <Heading fontSize="16px" fontWeight="800" color="white">
                                        Bữa Sáng (Breakfast)
                                    </Heading>
                                    <Badge bg="#1e2028" color="#8A8A93" fontSize="11px" fontWeight="700" px="2.5" py="0.5" borderRadius="full">
                                        {breakfastKcal} kcal
                                    </Badge>
                                </HStack>

                                <Text
                                    fontSize="12px"
                                    fontWeight="600"
                                    color="#8A8A93"
                                    cursor="pointer"
                                    _hover={{ color: '#E03030' }}
                                    onClick={() => {
                                        setTargetMealSection('Breakfast')
                                        setIsLogModalOpen(true)
                                    }}
                                >
                                    + Thêm món ăn
                                </Text>
                            </Flex>

                            {breakfastItems.length > 0 ? (
                                <Stack spacing="2.5">
                                    {breakfastItems.map((item, idx) => (
                                        <MealItemRow key={`${item.id}-${idx}`} item={item} onRemove={() => handleRemoveItem('Breakfast', idx)} />
                                    ))}
                                </Stack>
                            ) : (
                                <Box bg="#141720" border="1px dashed" borderColor="#1e2028" borderRadius="16px" p="5" textAlign="center">
                                    <Text fontSize="12px" color="#8A8A93" mb="2">
                                        Chưa có món ăn nào được ghi nhận cho Bữa sáng.
                                    </Text>
                                    <Button
                                        size="xs"
                                        variant="outline"
                                        borderColor="#2e3040"
                                        color="white"
                                        borderRadius="full"
                                        fontSize="11px"
                                        _hover={{ borderColor: '#E03030', color: '#E03030' }}
                                        onClick={() => {
                                            setTargetMealSection('Breakfast')
                                            setIsLogModalOpen(true)
                                        }}
                                    >
                                        + Thêm món từ Database
                                    </Button>
                                </Box>
                            )}
                        </Box>

                        {/* Lunch Section */}
                        <Box>
                            <Flex justify="space-between" align="center" mb="3">
                                <HStack spacing="2.5">
                                    <Heading fontSize="16px" fontWeight="800" color="white">
                                        Bữa Trưa (Lunch)
                                    </Heading>
                                    <Badge bg="#1e2028" color="#8A8A93" fontSize="11px" fontWeight="700" px="2.5" py="0.5" borderRadius="full">
                                        {lunchKcal} kcal
                                    </Badge>
                                </HStack>

                                <Text
                                    fontSize="12px"
                                    fontWeight="600"
                                    color="#8A8A93"
                                    cursor="pointer"
                                    _hover={{ color: '#E03030' }}
                                    onClick={() => {
                                        setTargetMealSection('Lunch')
                                        setIsLogModalOpen(true)
                                    }}
                                >
                                    + Thêm món ăn
                                </Text>
                            </Flex>

                            {lunchItems.length > 0 ? (
                                <Stack spacing="2.5">
                                    {lunchItems.map((item, idx) => (
                                        <MealItemRow key={`${item.id}-${idx}`} item={item} onRemove={() => handleRemoveItem('Lunch', idx)} />
                                    ))}
                                </Stack>
                            ) : (
                                <Box bg="#141720" border="1px dashed" borderColor="#1e2028" borderRadius="16px" p="5" textAlign="center">
                                    <Text fontSize="12px" color="#8A8A93" mb="2">
                                        Chưa có món ăn nào được ghi nhận cho Bữa trưa.
                                    </Text>
                                    <Button
                                        size="xs"
                                        variant="outline"
                                        borderColor="#2e3040"
                                        color="white"
                                        borderRadius="full"
                                        fontSize="11px"
                                        _hover={{ borderColor: '#E03030', color: '#E03030' }}
                                        onClick={() => {
                                            setTargetMealSection('Lunch')
                                            setIsLogModalOpen(true)
                                        }}
                                    >
                                        + Thêm món từ Database
                                    </Button>
                                </Box>
                            )}
                        </Box>

                        {/* Dinner Section */}
                        <Box>
                            <Flex justify="space-between" align="center" mb="3">
                                <HStack spacing="2.5">
                                    <Heading fontSize="16px" fontWeight="800" color="white">
                                        Bữa Tối (Dinner)
                                    </Heading>
                                    <Badge bg="#1e2028" color="#8A8A93" fontSize="11px" fontWeight="700" px="2.5" py="0.5" borderRadius="full">
                                        {dinnerKcal} kcal
                                    </Badge>
                                </HStack>

                                <Text
                                    fontSize="12px"
                                    fontWeight="600"
                                    color="#8A8A93"
                                    cursor="pointer"
                                    _hover={{ color: '#E03030' }}
                                    onClick={() => {
                                        setTargetMealSection('Dinner')
                                        setIsLogModalOpen(true)
                                    }}
                                >
                                    + Thêm món ăn
                                </Text>
                            </Flex>

                            {dinnerItems.length > 0 ? (
                                <Stack spacing="2.5">
                                    {dinnerItems.map((item, idx) => (
                                        <MealItemRow key={`${item.id}-${idx}`} item={item} onRemove={() => handleRemoveItem('Dinner', idx)} />
                                    ))}
                                </Stack>
                            ) : (
                                <Box bg="#141720" border="1px dashed" borderColor="#1e2028" borderRadius="16px" p="5" textAlign="center">
                                    <Text fontSize="12px" color="#8A8A93" mb="2">
                                        Chưa có món ăn nào được ghi nhận cho Bữa tối.
                                    </Text>
                                    <Button
                                        size="xs"
                                        variant="outline"
                                        borderColor="#2e3040"
                                        color="white"
                                        borderRadius="full"
                                        fontSize="11px"
                                        _hover={{ borderColor: '#E03030', color: '#E03030' }}
                                        onClick={() => {
                                            setTargetMealSection('Dinner')
                                            setIsLogModalOpen(true)
                                        }}
                                    >
                                        + Thêm món từ Database
                                    </Button>
                                </Box>
                            )}
                        </Box>

                        {/* Snack / Post-Workout Section */}
                        <Box>
                            <Flex justify="space-between" align="center" mb="3">
                                <HStack spacing="2.5">
                                    <Heading fontSize="16px" fontWeight="800" color="white">
                                        Bữa Phụ / Sau Tập (Snack)
                                    </Heading>
                                    <Badge bg="#1e2028" color="#8A8A93" fontSize="11px" fontWeight="700" px="2.5" py="0.5" borderRadius="full">
                                        {snackKcal} kcal
                                    </Badge>
                                </HStack>

                                <Text
                                    fontSize="12px"
                                    fontWeight="600"
                                    color="#8A8A93"
                                    cursor="pointer"
                                    _hover={{ color: '#E03030' }}
                                    onClick={() => {
                                        setTargetMealSection('Snack')
                                        setIsLogModalOpen(true)
                                    }}
                                >
                                    + Thêm món ăn
                                </Text>
                            </Flex>

                            {snackItems.length > 0 ? (
                                <Stack spacing="2.5">
                                    {snackItems.map((item, idx) => (
                                        <MealItemRow key={`${item.id}-${idx}`} item={item} onRemove={() => handleRemoveItem('Snack', idx)} />
                                    ))}
                                </Stack>
                            ) : (
                                <Box bg="#141720" border="1px dashed" borderColor="#1e2028" borderRadius="16px" p="5" textAlign="center">
                                    <Text fontSize="12px" color="#8A8A93" mb="2">
                                        Chưa có món ăn nào được ghi nhận cho Bữa phụ.
                                    </Text>
                                    <Button
                                        size="xs"
                                        variant="outline"
                                        borderColor="#2e3040"
                                        color="white"
                                        borderRadius="full"
                                        fontSize="11px"
                                        _hover={{ borderColor: '#E03030', color: '#E03030' }}
                                        onClick={() => {
                                            setTargetMealSection('Snack')
                                            setIsLogModalOpen(true)
                                        }}
                                    >
                                        + Thêm món từ Database
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </Stack>

                    {/* ── Right Column: Hydration & DB Food Explorer ──── */}
                    <Stack spacing="5">
                        {/* Hydration Card */}
                        <Box bg="#141720" border="1px solid" borderColor="#1e2028" borderRadius="20px" p="5">
                            <Flex justify="space-between" align="center" mb="4">
                                <Heading fontSize="15px" fontWeight="700" color="white">
                                    Lượng Nước (Hydration)
                                </Heading>
                                <Text fontSize="12px" color="#8A8A93" fontWeight="500">
                                    {waterCurrent} / {waterTotal} Ly
                                </Text>
                            </Flex>

                            {/* 8 Cups Row */}
                            <Flex justify="space-between" align="center">
                                {Array.from({ length: waterTotal }).map((_, i) => (
                                    <WaterCup
                                        key={i}
                                        filled={i < waterCurrent}
                                        onClick={i === waterCurrent ? () => handleLogGlass(i) : undefined}
                                    />
                                ))}
                            </Flex>
                            <Text fontSize="11px" color="#8A8A93" textAlign="center" mt="3">
                                Click vào ly tiếp theo để ghi nhận 250ml nước.
                            </Text>
                        </Box>

                        {/* Top DB Food Sources by Category */}
                        <Box bg="#141720" border="1px solid" borderColor="#1e2028" borderRadius="20px" p="5">
                            <Flex justify="space-between" align="center" mb="3">
                                <HStack spacing="2">
                                    <Icon as={FiTarget} color="#E03030" boxSize="15px" />
                                    <Heading fontSize="15px" fontWeight="700" color="white">
                                        Món Ăn DB Theo Nhóm Chất
                                    </Heading>
                                </HStack>
                                <Button
                                    size="xs"
                                    variant="ghost"
                                    color="#E03030"
                                    fontSize="11px"
                                    onClick={() => setIsLogModalOpen(true)}
                                >
                                    Xem tất cả
                                </Button>
                            </Flex>

                            <Text fontSize="11px" color="#8A8A93" mb="3.5">
                                Các món ăn tiêu biểu trong cơ sở dữ liệu giúp đáp ứng mục tiêu dinh dưỡng sau tập:
                            </Text>

                            <Tabs variant="soft-rounded" colorScheme="red" size="sm">
                                <TabList bg="#0A0C10" p="1" borderRadius="full" mb="3" overflowX="auto">
                                    <Tab fontSize="10px" color="#8A8A93" _selected={{ bg: '#E03030', color: 'white' }}>
                                        Đạm (Protein)
                                    </Tab>
                                    <Tab fontSize="10px" color="#8A8A93" _selected={{ bg: '#E03030', color: 'white' }}>
                                        Carbs
                                    </Tab>
                                    <Tab fontSize="10px" color="#8A8A93" _selected={{ bg: '#E03030', color: 'white' }}>
                                        Chất béo
                                    </Tab>
                                </TabList>

                                <TabPanels>
                                    <TabPanel p="0">
                                        <Stack spacing="2">
                                            {(dbFoods || [])
                                                .filter((f) => f.protein >= 15 || f.name.toLowerCase().includes('chicken') || f.name.toLowerCase().includes('salmon') || f.name.toLowerCase().includes('whey'))
                                                .slice(0, 4)
                                                .map((food) => (
                                                    <Flex key={food.id} align="center" justify="space-between" p="2" borderRadius="10px" bg="#0B0D13" _hover={{ bg: '#161922' }}>
                                                        <HStack spacing="2.5" minW="0">
                                                            <Box w="36px" h="36px" borderRadius="8px" overflow="hidden" flexShrink={0}>
                                                                <Image src={getFoodImage(food)} w="full" h="full" objectFit="cover" />
                                                            </Box>
                                                            <Box minW="0">
                                                                <Text fontSize="12px" fontWeight="700" color="white" noOfLines={1}>
                                                                    {food.name}
                                                                </Text>
                                                                <Text fontSize="10px" color="#8A8A93">
                                                                    {food.calories} kcal • {food.protein}g P
                                                                </Text>
                                                            </Box>
                                                        </HStack>
                                                        <IconButton
                                                            aria-label="Add"
                                                            icon={<Icon as={FiPlus} boxSize="11px" />}
                                                            size="xs"
                                                            isRound
                                                            variant="ghost"
                                                            color="#8A8A93"
                                                            _hover={{ color: 'white', bg: '#E03030' }}
                                                            onClick={() => handleAddFoodToMeal(food, 'Lunch')}
                                                        />
                                                    </Flex>
                                                ))}
                                        </Stack>
                                    </TabPanel>

                                    <TabPanel p="0">
                                        <Stack spacing="2">
                                            {(dbFoods || [])
                                                .filter((f) => f.carbs >= 15 || f.name.toLowerCase().includes('rice') || f.name.toLowerCase().includes('potato') || f.name.toLowerCase().includes('banana') || f.name.toLowerCase().includes('oat'))
                                                .slice(0, 4)
                                                .map((food) => (
                                                    <Flex key={food.id} align="center" justify="space-between" p="2" borderRadius="10px" bg="#0B0D13" _hover={{ bg: '#161922' }}>
                                                        <HStack spacing="2.5" minW="0">
                                                            <Box w="36px" h="36px" borderRadius="8px" overflow="hidden" flexShrink={0}>
                                                                <Image src={getFoodImage(food)} w="full" h="full" objectFit="cover" />
                                                            </Box>
                                                            <Box minW="0">
                                                                <Text fontSize="12px" fontWeight="700" color="white" noOfLines={1}>
                                                                    {food.name}
                                                                </Text>
                                                                <Text fontSize="10px" color="#8A8A93">
                                                                    {food.calories} kcal • {food.carbs}g C
                                                                </Text>
                                                            </Box>
                                                        </HStack>
                                                        <IconButton
                                                            aria-label="Add"
                                                            icon={<Icon as={FiPlus} boxSize="11px" />}
                                                            size="xs"
                                                            isRound
                                                            variant="ghost"
                                                            color="#8A8A93"
                                                            _hover={{ color: 'white', bg: '#E03030' }}
                                                            onClick={() => handleAddFoodToMeal(food, 'Lunch')}
                                                        />
                                                    </Flex>
                                                ))}
                                        </Stack>
                                    </TabPanel>

                                    <TabPanel p="0">
                                        <Stack spacing="2">
                                            {(dbFoods || [])
                                                .filter((f) => f.name.toLowerCase().includes('avocado') || f.name.toLowerCase().includes('almond') || f.name.toLowerCase().includes('peanut') || f.name.toLowerCase().includes('oil'))
                                                .slice(0, 4)
                                                .map((food) => (
                                                    <Flex key={food.id} align="center" justify="space-between" p="2" borderRadius="10px" bg="#0B0D13" _hover={{ bg: '#161922' }}>
                                                        <HStack spacing="2.5" minW="0">
                                                            <Box w="36px" h="36px" borderRadius="8px" overflow="hidden" flexShrink={0}>
                                                                <Image src={getFoodImage(food)} w="full" h="full" objectFit="cover" />
                                                            </Box>
                                                            <Box minW="0">
                                                                <Text fontSize="12px" fontWeight="700" color="white" noOfLines={1}>
                                                                    {food.name}
                                                                </Text>
                                                                <Text fontSize="10px" color="#8A8A93">
                                                                    {food.calories} kcal • {food.fat}g F
                                                                </Text>
                                                            </Box>
                                                        </HStack>
                                                        <IconButton
                                                            aria-label="Add"
                                                            icon={<Icon as={FiPlus} boxSize="11px" />}
                                                            size="xs"
                                                            isRound
                                                            variant="ghost"
                                                            color="#8A8A93"
                                                            _hover={{ color: 'white', bg: '#E03030' }}
                                                            onClick={() => handleAddFoodToMeal(food, 'Lunch')}
                                                        />
                                                    </Flex>
                                                ))}
                                        </Stack>
                                    </TabPanel>
                                </TabPanels>
                            </Tabs>
                        </Box>
                    </Stack>
                </Grid>

                {/* ── Log Meal Modal (Select from DB foods) ──── */}
                <Modal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} size="xl" isCentered>
                    <ModalOverlay bg="rgba(0,0,0,0.75)" backdropFilter="blur(6px)" />
                    <ModalContent bg="#141720" border="1px solid" borderColor="#1e2028" borderRadius="20px" p="2">
                        <ModalHeader color="white" fontSize="18px" fontWeight="800">
                            Thêm Món Ăn Vào {targetMealSection === 'Breakfast' ? 'Bữa Sáng' : targetMealSection === 'Lunch' ? 'Bữa Trưa' : targetMealSection === 'Dinner' ? 'Bữa Tối' : 'Bữa Phụ'}
                        </ModalHeader>
                        <ModalCloseButton color="#8A8A93" />
                        <ModalBody pb="6">
                            {/* Search and Category Filter */}
                            <Flex gap="3" mb="4" direction={{ base: 'column', sm: 'row' }}>
                                <Flex
                                    align="center"
                                    bg="#0A0C10"
                                    border="1px solid"
                                    borderColor="#1e2028"
                                    borderRadius="10px"
                                    px="3"
                                    py="2"
                                    flex="1"
                                >
                                    <Icon as={FiSearch} color="#8A8A93" />
                                    <Input
                                        placeholder="Tìm món ăn trong Database..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        variant="unstyled"
                                        size="sm"
                                        ml="2"
                                        color="white"
                                        _placeholder={{ color: '#8A8A93' }}
                                    />
                                </Flex>

                                <HStack spacing="1.5" overflowX="auto" py="1">
                                    {[
                                        { id: 'ALL', label: 'Tất cả' },
                                        { id: 'Protein', label: 'Đạm cao' },
                                        { id: 'Carbs', label: 'Tinh bột' },
                                        { id: 'HealthyFat', label: 'Chất béo' },
                                        { id: 'Vitamins', label: 'Rau củ' },
                                    ].map((cat) => (
                                        <Button
                                            key={cat.id}
                                            size="xs"
                                            borderRadius="full"
                                            fontSize="11px"
                                            bg={selectedCategoryFilter === cat.id ? '#E03030' : '#0A0C10'}
                                            color={selectedCategoryFilter === cat.id ? 'white' : '#8A8A93'}
                                            border="1px solid"
                                            borderColor={selectedCategoryFilter === cat.id ? '#E03030' : '#1e2028'}
                                            onClick={() => setSelectedCategoryFilter(cat.id)}
                                        >
                                            {cat.label}
                                        </Button>
                                    ))}
                                </HStack>
                            </Flex>

                            <Stack spacing="2.5" maxH="380px" overflowY="auto" pr="1">
                                {filteredDbFoods.length === 0 ? (
                                    <Text fontSize="13px" color="#8A8A93" textAlign="center" py="8">
                                        Không tìm thấy món ăn nào phù hợp trong cơ sở dữ liệu.
                                    </Text>
                                ) : (
                                    filteredDbFoods.map((food) => (
                                        <Flex
                                            key={food.id}
                                            align="center"
                                            justify="space-between"
                                            bg="#0A0C10"
                                            p="3"
                                            borderRadius="12px"
                                            border="1px solid"
                                            borderColor="#1e2028"
                                            _hover={{ borderColor: '#2e3040' }}
                                        >
                                            <HStack spacing="3" minW="0" flex="1">
                                                <Box w="46px" h="46px" borderRadius="10px" overflow="hidden" flexShrink={0} bg="#1a1d26">
                                                    <Image src={getFoodImage(food)} w="full" h="full" objectFit="cover" />
                                                </Box>
                                                <Box minW="0" flex="1">
                                                    <Text fontSize="14px" fontWeight="700" color="white" noOfLines={1}>
                                                        {food.name}
                                                    </Text>
                                                    <Text fontSize="11px" color="#8A8A93">
                                                        {food.servingSize} {food.unit} • <Text as="span" color="#F27A7A" fontWeight="600">{food.calories} kcal</Text>
                                                    </Text>
                                                    <HStack spacing="2" mt="1">
                                                        <Badge bg="rgba(224,48,48,0.15)" color="#E03030" fontSize="9px">
                                                            {food.protein}g Đạm
                                                        </Badge>
                                                        <Badge bg="rgba(79,209,197,0.15)" color="#4FD1C5" fontSize="9px">
                                                            {food.carbs}g Carbs
                                                        </Badge>
                                                        <Badge bg="rgba(246,173,85,0.15)" color="#F6AD55" fontSize="9px">
                                                            {food.fat}g Béo
                                                        </Badge>
                                                    </HStack>
                                                </Box>
                                            </HStack>

                                            <Button
                                                size="xs"
                                                bg="#E03030"
                                                _hover={{ bg: '#ff3d3d' }}
                                                color="white"
                                                borderRadius="full"
                                                px="3.5"
                                                h="28px"
                                                isLoading={loggingFoodId === food.id}
                                                onClick={() => handleSelectFoodFromModal(food)}
                                            >
                                                + Thêm
                                            </Button>
                                        </Flex>
                                    ))
                                )}
                            </Stack>
                        </ModalBody>
                    </ModalContent>
                </Modal>
            </Box>
        </MemberLayout>
    )
}

export default Nutrition
