import React, { useState } from 'react'
import { CheckCircle, XCircle, Zap } from 'lucide-react'
import { rulesApi } from '../../services/api'
import Button from '../ui/Button'

export default function RuleTestPanel({ rule, onClose }) {
  const [testEvent, setTestEvent] = useState(
    JSON.stringify({
      eventName: "ConsoleLogin",
      eventSource: "signin.amazonaws.com",
      userIdentity: {
        type: "Root",
        arn: "arn:aws:iam::123456789:root"
      },
      sourceIPAddress: "1.2.3.4",
      awsRegion: "ap-south-1"
    }, null, 2)
  )
  
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleTest = async () => {
    try {
      JSON.parse(testEvent)
    } catch {
      setResult({ error: 'Invalid JSON — please check syntax' })
      return
    }
    
    setIsLoading(true)
    try {
      const response = await rulesApi.testRule({
        ruleData: rule,
        sampleEvent: JSON.parse(testEvent)
      })
      setResult(response)
    } catch (err) {
      setResult({ error: err?.response?.data?.error?.message || 'Test failed' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-[#13151b] border border-[#1f2229] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1f2229] flex items-center gap-2">
        <Zap className="w-3.5 h-3.5 text-[#06b6d4]" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Test Rule</span>
      </div>
      <div className="p-4 space-y-3">
        <textarea
          value={testEvent}
          onChange={e => {
            setTestEvent(e.target.value)
            setResult(null)
          }}
          placeholder="Paste a CloudTrail event JSON to test..."
          className="w-full bg-[#05060a] border border-[#1f2229] rounded-xl p-3 font-mono text-[11px] text-slate-300 resize-none h-32 focus:outline-none focus:border-[#06b6d4]/50 placeholder-slate-700"
        />
        <Button variant="outline" size="sm" onClick={handleTest} isLoading={isLoading} className="w-full">
          Run Test
        </Button>
        {result && (
          result.error ? (
            <div className="bg-[#f0384a]/8 border border-[#f0384a]/20 rounded-xl p-4">
              <p className="text-[11px] text-[#f0384a]">{result.error}</p>
            </div>
          ) : result.matched ? (
            <div className="bg-[#2fbf71]/8 border border-[#2fbf71]/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-[#2fbf71]" />
                <span className="text-sm font-semibold text-[#2fbf71]">Rule Matched</span>
              </div>
              {result.matchedPatterns?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {result.matchedPatterns.map((p, i) => (
                    <span key={i} className="font-mono text-[10px] bg-[#05060a] text-slate-400 px-2 py-0.5 rounded">
                      {p.field || p.type || JSON.stringify(p)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#191c24] border border-[#2a2e38] rounded-xl p-4 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-slate-600" />
              <span className="text-sm text-slate-500">No Match</span>
            </div>
          )
        )}
      </div>
    </div>
  )
}
