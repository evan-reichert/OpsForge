// In this component, we will create the bar chart, which after a CSV file is uploaded and parsed, will display the most common issues in a bar chart
// The data is processed and ran through an AI model which will assign it an issue category
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer
} from 'recharts';
import './BarChart.css';

type IssueCount = {
    issue: string;
    count: number;
};

function BarChartComponent({ data }: { data: IssueCount[] }) {
    if (!data || data.length === 0) {
        return <div style={{ padding: '1rem', color: '#6c757d' }}>No issue data available yet.</div>;
    }

    const sortedData = [...data].sort((a, b) => b.count - a.count);

    return (
        <div className="issue-bar-chart">
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="issue" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [value, 'Count']} />
                    <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// Export the BarChartComponent for use in other parts of the application
export default BarChartComponent;