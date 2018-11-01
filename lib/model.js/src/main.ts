import { Model } from "./model";
import { Type } from "./type";
import { Property } from "./property";
import { Entity } from "./entity";
import { Format } from "./format";

var api = Model as any;

// TODO: provide plugin model?

api.Model = Model;
api.Type = Type;
api.Property = Property;
api.Entity = Entity;
api.Format = Format;

export default api;
