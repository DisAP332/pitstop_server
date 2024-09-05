import { Client } from "pg";

//**************************************************************************\\

// *************************************************************************\\

// this creates the $1, $2, $3 string necessary for the columns placeholders.
const placeholder_generator = (length: number) => {
  let result: Array<string> = [];
  for (let i = 0; i < length; i++) {
    result.push(`$${i + 1}`);
  }
  return result;
};

// DATABASE CRUD ACTIONS

// const insert = (table: string, columns: string, values: Array<string>) => {
//   client.query(
//     `INSERT INTO "${table}"(${columns}) VALUES(${placeholder_generator(
//       values.length
//     ).toString()})`,
//     values,
//     (err: Error, res: any) => {
//       if (err) {
//         console.error("Query error", err.stack);
//       } else {
//         console.log("Insert successful");
//       }
//     }
//   );
// };

// client.query(`SELECT $1 FROM "user" WHERE email = $2`);

// const select = async (
//   table: string,
//   columns: Array<string>,
//   condition: string,
//   values: Array<string>
// ) => {
//   let result: any;

//   // generate placeholders for query
//   let placeholders = placeholder_generator(values.length + columns.length);
//   // save SQL to use in query
//   const query = `SELECT * FROM "${table}" WHERE ${condition}=$1`;

//   console.log(query);
//   console.log([...columns, ...values]);

//   await client.query(query, ["blue22@gmail.com"], (err: Error, res: any) => {
//     if (err) {
//       console.error("Query error", err.stack);
//       return (result = {
//         success: false,
//         response: res,
//       });
//     } else {
//       console.log("Search successful", res.rows);
//       return (result = {
//         success: false,
//         response: res,
//       });
//     }
//   });
// };

// const select = async (
//   table: string,
//   condition: string,
//   values: Array<string>
// ) => {
//   let result: any;

//   // save SQL to use in query
//   const query = `SELECT * FROM "${table}" WHERE ${condition}=$1`;

//   try {
//     // Await the promise returned by Client.query
//     const res = await Client.query(query, values);

//     console.log("Search successful", res.rows);
//     result = {
//       success: true, // Mark success as true
//       response: res.rows, // You usually want to return rows, not the full response
//     };
//   } catch (err: unknown) {
//     console.error("Query error", err.stack);
//     result = {
//       success: false,
//       response: err, // Pass the error object to the response
//     };
//   }

//   return result;
// };

// const db_methods = {
//   select,
// };

// export default db_methods;
