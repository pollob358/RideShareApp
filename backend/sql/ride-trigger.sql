
CREATE OR REPLACE FUNCTION after_ride_insert()
RETURNS TRIGGER AS $$
BEGIN

  INSERT INTO Ride_Request (Ride_ID)
  VALUES (NEW.Ride_ID);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS ride_request_insert_trigger ON Ride;

CREATE TRIGGER ride_request_insert_trigger
AFTER INSERT ON Ride
FOR EACH ROW
EXECUTE FUNCTION after_ride_insert();
