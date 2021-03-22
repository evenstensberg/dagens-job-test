const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');

/* or read directly as fs.readfile to keep it sync, 
   let's assume in-memory for now :)
*/
const PRODUCTS = require('./db');
const { v4 } = require('@lukeed/uuid');
const { assert } = require('console');

const PORT = process.env.PORT || 3001;
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

http.createServer(app).listen(PORT, () => {
  console.log(`Listening on 0.0.0.0:${PORT} 🚀`);
});

app.get('/', (_, res) => {
  res.send({ status: 200 });
});

app.get('/get-nearest-price', (resp, res) => {
  const { query } = resp;
  const {
    id
  } = query;
  const n_limit_size = 10;

  let productsSet = [...PRODUCTS];
  if(id) {

    // Find category
    const tempArray = productsSet.filter(product => product.id === id);
    const selectedProduct = tempArray.length ? tempArray[0] : undefined;
    if(!selectedProduct) {
      res.send({ status: 500 });
      return;
    }

    // Filter item set by category
    const selectedCateory = selectedProduct.category;
    const selectedPrice = selectedProduct.price;
    productsSet = productsSet.filter(product => product.category === selectedCateory);

    // Sort items by price
    let resultingArray = [];
    productsSet = productsSet.sort((a, b) => {
      return a.price - b.price;
    });

    // Calculate diff between the price and all items
    let diffIndices = [];
    productsSet.forEach((product, idx) => {
        // Use math.abs to include negative values
        const difference = Math.abs(selectedPrice - product.price);
        diffIndices.push({diff: difference, idx: idx});
    });

    // Sort by difference
    diffIndices = diffIndices.sort((a, b) => {
      return a.diff - b.diff;
    });

    // Limit array by size
    diffIndices = diffIndices.slice(0, n_limit_size);
    let filteredProducts = [];

    // Add the best diff sums to resulting array
    diffIndices.forEach(diff => {
      filteredProducts.push(productsSet[diff.idx]);
    })
    res.json({ payload: filteredProducts });
    return;
  }

  res.send({ status: 500 });
});

app.get('/get-products', (resp, res) => {
  const { query: {
    category,
    name,
    minPrice,
    maxPrice,
    limit
  } } = resp;

  let productsSet = [...PRODUCTS];
  if (category) {
    productSet = productsSet.filter(product => product.category === category);
  }

  if (minPrice && maxPrice) {
    productsSet = productsSet.filter(product => parseInt(product.price) >= parseInt(minPrice) && parseInt(product.price) <= parseInt(maxPrice));
  }

  if (minPrice) {
    productsSet = productsSet.filter(product => parseInt(product.price) >= parseInt(minPrice));
  }

  if (maxPrice) {
    productsSet = productsSet.filter(product => parseInt(product.price) <= parseInt(maxPrice));
  }

  if (name) {
    productsSet = productsSet.filter(product => ~product.name.indexOf(name));
  }

  let arrayLength = productsSet.length;
  let limitIdx = 0;
  const chunk_size = 24;
  
  // check if the query is available
  const pagingIdx = limit ? parseInt(limit) : 0;

  for (let idx = 0; idx < arrayLength; idx += chunk_size, limitIdx++) {
      // chunk array into 24 items of each chunk
      pagerChunk = productsSet.slice(idx, idx+chunk_size);
      // check if index is within limits to whats specified
      if(pagingIdx === limitIdx) {
        res.json({ payload: pagerChunk });
      }
  }
});

app.post('/create-product', (req, res) => {
  const { body } = req;
  if (!Object.keys(body).length) {
    res.send({ code: 500 })
  }
  const payload = {
    ...body,
    id: v4()
  };

  const originalSize = PRODUCTS.size;

  PRODUCTS.add(payload);

  assert(originalSize.size != PRODUCTS.size);
  res.json(payload);
});

process.on('SIGINT', function () {
  process.exit();
});
