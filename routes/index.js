import { Router } from 'express';

const constructorMethod = (app) => {
  app.get('/', (req, res) => {
    res.render('home');
  });

  // You can add more subroutes later (events, users…)

  app.use('*', (req, res) => {
    res.status(404).send("Page Not Found");
  });
};

export default constructorMethod;