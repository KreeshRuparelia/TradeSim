import React, { useEffect, useState } from 'react';
import {
  Newspaper,
  BookOpen,
  ExternalLink,
  Loader2,
  TrendingUp,
  DollarSign,
  PieChart,
  Shield,
  RefreshCw,
} from 'lucide-react';

// Educational resources (static content)
const educationalResources = [
  {
    id: '1',
    title: 'Understanding Stock Market Basics',
    description: 'Learn what stocks are, how the market works, and key terminology every investor should know.',
    icon: TrendingUp,
    color: 'bg-blue-100 text-blue-600',
    url: 'https://www.investopedia.com/articles/basics/06/invest1000.asp',
  },
  {
    id: '2',
    title: 'How to Read Stock Charts',
    description: 'Master the art of technical analysis and understand price movements through chart patterns.',
    icon: PieChart,
    color: 'bg-purple-100 text-purple-600',
    url: 'https://www.investopedia.com/trading/candlestick-charting-what-is-it/',
  },
  {
    id: '3',
    title: 'Building a Diversified Portfolio',
    description: 'Discover why diversification matters and how to spread risk across different investments.',
    icon: Shield,
    color: 'bg-green-100 text-green-600',
    url: 'https://www.investopedia.com/terms/d/diversification.asp',
  },
  {
    id: '4',
    title: 'Understanding Market Orders vs Limit Orders',
    description: 'Learn the difference between order types and when to use each one.',
    icon: DollarSign,
    color: 'bg-orange-100 text-orange-600',
    url: 'https://www.investopedia.com/terms/l/limitorder.asp',
  },
];

interface NewsArticle {
  uuid: string;
  title: string;
  description: string;
  url: string;
  image_url: string;
  published_at: string;
  source: string;
}

function getPlaceholderNews(): NewsArticle[] {
  return [
    {
      uuid: '1',
      title: 'Markets Rally on Strong Economic Data',
      description: 'Major indices closed higher as investors reacted positively to better-than-expected employment figures and consumer spending data.',
      url: '#',
      image_url: '',
      published_at: new Date().toISOString(),
      source: 'Sample News',
    },
    {
      uuid: '2',
      title: 'Tech Sector Leads Gains in Early Trading',
      description: 'Technology stocks are outperforming the broader market as earnings reports exceed analyst expectations.',
      url: '#',
      image_url: '',
      published_at: new Date().toISOString(),
      source: 'Sample News',
    },
    {
      uuid: '3',
      title: 'Federal Reserve Signals Policy Outlook',
      description: 'Central bank officials provided insights into their economic projections and monetary policy considerations.',
      url: '#',
      image_url: '',
      published_at: new Date().toISOString(),
      source: 'Sample News',
    },
  ];
}

export default function LearnPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'news' | 'learn'>('news');

  const fetchNews = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const apiKey = import.meta.env.VITE_MARKETAUX_API_KEY;
      
      if (!apiKey) {
        setNews(getPlaceholderNews());
        setError('Add VITE_MARKETAUX_API_KEY to .env for live news.');
        return;
      }

      const response = await fetch(
        `https://api.marketaux.com/v1/news/all?filter_entities=true&language=en&api_token=${apiKey}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const data = await response.json();
      setNews(data.data || []);
    } catch (err) {
      console.error('News fetch error:', err);
      setError('Unable to load news. Showing sample articles.');
      setNews(getPlaceholderNews());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Learn</h1>
        <p className="text-gray-500 mt-1">Stay informed with market news and educational resources</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('news')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'news'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          Market News
        </button>
        <button
          onClick={() => setActiveTab('learn')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'learn'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Learning Resources
        </button>
      </div>

      {/* News Tab */}
      {activeTab === 'news' && (
        <div className="space-y-6">
          {/* Refresh Button */}
          <div className="flex justify-end">
            <button
              onClick={fetchNews}
              disabled={isLoading}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4">
              {news.slice(0, 10).map((article, index) => (
                <a
                  key={article.uuid}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-hover flex gap-5 group animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {article.image_url && (
                    <div className="flex-shrink-0 w-40 h-28 rounded-xl overflow-hidden bg-gray-100">
                      <img
                        src={article.image_url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                      {article.description}
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                      <span>{article.source}</span>
                      <span>•</span>
                      <span>
                        {new Date(article.published_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Learn Tab */}
      {activeTab === 'learn' && (
        <div className="grid md:grid-cols-2 gap-6">
          {educationalResources.map((resource, index) => (
            <a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card-hover group animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${resource.color}`}>
                  <resource.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                      {resource.title}
                    </h3>
                    <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{resource.description}</p>
                </div>
              </div>
            </a>
          ))}

          {/* Additional Tips Section */}
          <div className="md:col-span-2 card bg-gradient-to-br from-brand-50 to-white">
            <h3 className="font-display font-bold text-gray-900 mb-4">Quick Tips for Beginners</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <TipItem text="Start small and learn as you go - you don't need thousands to begin" />
              <TipItem text="Diversify your portfolio across different sectors and asset types" />
              <TipItem text="Focus on long-term growth rather than short-term speculation" />
              <TipItem text="Keep emotions in check - don't panic sell during market dips" />
              <TipItem text="Research companies before investing - understand what you own" />
              <TipItem text="Consider index funds for broad market exposure with lower risk" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TipItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-2 h-2 bg-brand-500 rounded-full mt-2 flex-shrink-0" />
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  );
}
