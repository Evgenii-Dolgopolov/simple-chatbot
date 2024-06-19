import { dates } from "/utils/dates"

const polygonApiKey = import.meta.env.VITE_POLYGON_API_KEY
const openAiApiKey = import.meta.env.VITE_OPENAI_API_KEY

const tickersArr = []

const generateReportBtn = document.querySelector(".generate-report-btn")

generateReportBtn.addEventListener("click", fetchStockData)

document.getElementById("ticker-input-form").addEventListener("submit", e => {
  e.preventDefault()
  const tickerInput = document.getElementById("ticker-input")
  if (tickerInput.value.length > 1) {
    generateReportBtn.disabled = false
    const newTickerStr = tickerInput.value
    tickersArr.push(newTickerStr.toUpperCase())
    tickerInput.value = ""
    renderTickers()
  } else {
    const label = document.getElementsByTagName("label")[0]
    label.style.color = "red"
    label.textContent =
      "You must add a ticker. A ticker is a 3 letter or more code for a stock. E.g TSLA for Tesla."
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
        const data = await response.json()
        const status = await response.status
        if (status === 200) {
          apiMessage.innerText = "Creating report..."

          delete data.request_id
          return JSON.stringify(data)
        } else {
          loadingArea.innerText = "There was an error fetching stock data."
        }
      })
    )
    fetchReport(stockData.join(""))
  } catch (err) {
    loadingArea.innerText = "There was an error fetching stock data."
    console.error(err.message)
  }
}

async function fetchReport(data) {
  const messages = [
    {
      role: "system",
      content:
        "You are a trading analyst. Given data on share prices over the past 3 days, write a report with recommendation for the stocks provided. Use examples provided between ### to set the style and tone of your response. Don't include ### in your response.",
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
    const url = "https://openai-api-worker.uizz.workers.dev"
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Worker Error: ${data.error}`)
    }
    renderReport(data.content)
    
  } catch (err) {
    console.error(err.message)
    loadingArea.innerText = "Unable to access AI. Please refresh and try again"
  }
}

function renderReport(output) {
  loadingArea.style.display = "none"
  const outputArea = document.querySelector(".output-panel")
  const report = document.createElement("p")
  outputArea.appendChild(report)
  report.textContent = output
  outputArea.style.display = "flex"
}