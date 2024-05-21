import { dates } from "/utils/dates"
import OpenAI from "openai"

const polygonApiKey = import.meta.env.VITE_POLYGON_API_KEY
const openAiApiKey = import.meta.env.VITE_OPENAI_API_KEY

const tickersArr = []

const openai = new OpenAI({
  apiKey: openAiApiKey,
  dangerouslyAllowBrowser: true,
})

const generateReportBtn = document.querySelector(".generate-report-btn")

generateReportBtn.addEventListener("click", fetchStockData)

document.getElementById("ticker-input-form").addEventListener("submit", e => {
  e.preventDefault()
  const tickerInput = document.getElementById("ticker-input")
  if (tickerInput.value.length > 2) {
    generateReportBtn.disabled = false
    const newTickerStr = tickerInput.value
    tickersArr.push(newTickerStr.toUpperCase())
    tickerInput.value = ""
    renderTickers()
  } else {
    const label = document.getElementsByTagName("label")[0]
    label.style.color = "red"
    label.textContent =
      "You must add at least one ticker. A ticker is a 3 letter or more code for a stock. E.g TSLA for Tesla."
  }
})

function renderTickers() {
  const tickersDiv = document.querySelector(".ticker-choice-display")
  tickersDiv.innerHTML = ""
  tickersArr.forEach(ticker => {
    const newTickerSpan = document.createElement("span")
    newTickerSpan.textContent = ticker
    newTickerSpan.classList.add("ticker")
    tickersDiv.appendChild(newTickerSpan)
  })
}

const loadingArea = document.querySelector(".loading-panel")
const apiMessage = document.getElementById("api-message")

async function fetchStockData() {
  document.querySelector(".action-panel").style.display = "none"
  loadingArea.style.display = "flex"
  try {
    const stockData = await Promise.all(
      tickersArr.map(async ticker => {
        const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${dates.startDate}/${dates.endDate}?apiKey=${polygonApiKey}`
        const response = await fetch(url)
        const data = await response.text()
        const status = await response.status
        if (status === 200) {
          apiMessage.innerText = "Creating report..."
          return data
        } else {
          loadingArea.innerText = "There was an error fetching stock data."
        }
      })
    )
    fetchReport(stockData.join(""))
  } catch (err) {
    loadingArea.innerText = "There was an error fetching stock data."
    console.error("error: ", err)
  }
}

async function main(data) {
  const messages = [
    {
      role: "system",
      content:
        "You are a trading guru. Given data on share prices over the past 3 days, write a report of no more than 3 sentences recommending whether to buy, hold or sell the stock. Use examples provided between ### to set the style and tone of your response.",
      temperature: 1.2,
      presence_penalty: 0,
      frequency_penalty: 0
    },
    {
      role: "user",
      content: `${data}
        ### 
        Aye peep this fam, the AAPL ting been showing mad increases in share price over the past 3 days, with a volume-weighted average price going dumb from $187.18 to $189.65. We going all the way to the moon with this trend, baaabyy. So you better cop AAPL stock if you trying live it big and do it large, ya dig.
        ###`,
    },
  ]

  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: messages,
      model: "gpt-3.5-turbo-0125",
    })
    renderReport(chatCompletion.choices[0].message.content.replace(/[*#]/g, ""))
  } catch (err) {
    loadingArea.innerText = "There was an error fetching stock data."
    console.error("error: ", err)
  }
}

async function fetchReport(data) {
  return main(data)
}

function renderReport(output) {
  loadingArea.style.display = "none"
  const outputArea = document.querySelector(".output-panel")
  const report = document.createElement("p")
  outputArea.appendChild(report)
  report.textContent = output
  outputArea.style.display = "flex"
}
