import useSWR from 'swr'
import BodyMetricsModal from '../../pages/member/components/BodyMetricsModal'
import { addBodyMetric, getLatestBodyMetric } from '../../api/bodyMetrics'

const BasicInfoPrompt = () => {
    const { data: metric, isLoading, mutate } = useSWR('latest-metric', getLatestBodyMetric)
    const handleSave = async (data: { age: number; gender: string; height: number; weight: number }) => {
        const newMetric = await addBodyMetric(data)
        await mutate(newMetric, false)
    }

    return (
        <BodyMetricsModal
            isOpen={!isLoading && metric === null}
            onClose={() => undefined}
            onSave={handleSave}
        />
    )
}

export default BasicInfoPrompt
