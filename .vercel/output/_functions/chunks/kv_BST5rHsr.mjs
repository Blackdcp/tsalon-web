import { r as __require, t as __commonJSMin } from "./rolldown-runtime_Bl3dcgcQ.mjs";
//#region src/lib/kv.js
var require_kv = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __assign = exports && exports.__assign || function() {
		__assign = Object.assign || function(t) {
			for (var s, i = 1, n = arguments.length; i < n; i++) {
				s = arguments[i];
				for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
			}
			return t;
		};
		return __assign.apply(this, arguments);
	};
	var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P ? value : new P(function(resolve) {
				resolve(value);
			});
		}
		return new (P || (P = Promise))(function(resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator["throw"](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
	var __generator = exports && exports.__generator || function(thisArg, body) {
		var _ = {
			label: 0,
			sent: function() {
				if (t[0] & 1) throw t[1];
				return t[1];
			},
			trys: [],
			ops: []
		}, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
		return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
			return this;
		}), g;
		function verb(n) {
			return function(v) {
				return step([n, v]);
			};
		}
		function step(op) {
			if (f) throw new TypeError("Generator is already executing.");
			while (g && (g = 0, op[0] && (_ = 0)), _) try {
				if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
				if (y = 0, t) op = [op[0] & 2, t.value];
				switch (op[0]) {
					case 0:
					case 1:
						t = op;
						break;
					case 4:
						_.label++;
						return {
							value: op[1],
							done: false
						};
					case 5:
						_.label++;
						y = op[1];
						op = [0];
						continue;
					case 7:
						op = _.ops.pop();
						_.trys.pop();
						continue;
					default:
						if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
							_ = 0;
							continue;
						}
						if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
							_.label = op[1];
							break;
						}
						if (op[0] === 6 && _.label < t[1]) {
							_.label = t[1];
							t = op;
							break;
						}
						if (t && _.label < t[2]) {
							_.label = t[2];
							_.ops.push(op);
							break;
						}
						if (t[2]) _.ops.pop();
						_.trys.pop();
						continue;
				}
				op = body.call(thisArg, _);
			} catch (e) {
				op = [6, e];
				y = 0;
			} finally {
				f = t = 0;
			}
			if (op[0] & 5) throw op[1];
			return {
				value: op[0] ? op[1] : void 0,
				done: true
			};
		}
	};
	var __importDefault = exports && exports.__importDefault || function(mod) {
		return mod && mod.__esModule ? mod : { "default": mod };
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.kv = void 0;
	exports.getOrCreateUploadToken = getOrCreateUploadToken;
	exports.getUserIdByToken = getUserIdByToken;
	exports.updateTokenUsage = updateTokenUsage;
	exports.getLeaderboard = getLeaderboard;
	exports.getGlobalStats = getGlobalStats;
	exports.getUserAnalytics = getUserAnalytics;
	var ioredis_1 = __importDefault(__require("ioredis"));
	var redisUrl = process.env.REDIS_URL || "";
	exports.kv = redisUrl ? new ioredis_1.default(redisUrl) : null;
	function getOrCreateUploadToken(userId) {
		return __awaiter(this, void 0, void 0, function() {
			var existingToken, newToken;
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0:
						if (!exports.kv) return [2, "mock-token-" + crypto.randomUUID()];
						return [4, exports.kv.get("user:".concat(userId, ":token"))];
					case 1:
						existingToken = _a.sent();
						if (existingToken) return [2, existingToken];
						newToken = crypto.randomUUID();
						return [4, exports.kv.set("user:".concat(userId, ":token"), newToken)];
					case 2:
						_a.sent();
						return [4, exports.kv.set("token:".concat(newToken, ":userId"), userId)];
					case 3:
						_a.sent();
						return [2, newToken];
				}
			});
		});
	}
	function getUserIdByToken(token) {
		return __awaiter(this, void 0, void 0, function() {
			return __generator(this, function(_a) {
				if (!exports.kv) return [2, "mock-user-123"];
				return [2, exports.kv.get("token:".concat(token, ":userId"))];
			});
		});
	}
	function updateTokenUsage(userId_1, name_1, image_1, tokens_1) {
		return __awaiter(this, arguments, void 0, function(userId, name, image, tokens, deviceId, historyData) {
			var normalizedTokens, _i, _a, _b, k, v, oldDeviceDataStr, oldDeviceTokens, parsed, _c, _d, _e, k, v, deviceTotal, deviceData, now, todayStr, pipe, hasTimeseriesEvents, keysToFilter, toolsInHistory_1, _f, _g, toolsObj, _loop_1, _h, keysToFilter_1, key, _j, _k, _l, dateStr, toolsObj, _m, _o, _p, tool, val, model, cacheRate, _q, _r, _s, tool, val, oldVal, delta, model, cacheRate, toolHasHistory, _t, _u, toolsObj, _v, _w, _x, dateStr, toolsObj, hVal, event_1, isFirstRun, days, dailyAvg, i, d, historyDateStr, tokensToLog, event_2, event_3, deviceKeys, aggregatedTokens, allDeviceData, _y, allDeviceData_1, dataStr, parsed, _z, _0, _1, t, v, objV, finalTotal, aggregatedData;
			if (deviceId === void 0) deviceId = "default_device";
			if (historyData === void 0) historyData = null;
			return __generator(this, function(_2) {
				switch (_2.label) {
					case 0:
						if (!exports.kv) return [2];
						normalizedTokens = {};
						for (_i = 0, _a = Object.entries(tokens); _i < _a.length; _i++) {
							_b = _a[_i], k = _b[0], v = _b[1];
							if (k === "total" || k === "history") continue;
							if (typeof v === "number") normalizedTokens[k] = {
								total: v,
								in: v * .9,
								out: v * .1,
								cache_read: 0,
								cache_write: 0
							};
							else if (v && typeof v === "object") normalizedTokens[k] = v;
						}
						return [4, exports.kv.get("user:".concat(userId, ":device:").concat(deviceId, ":data"))];
					case 1:
						oldDeviceDataStr = _2.sent();
						oldDeviceTokens = {};
						if (oldDeviceDataStr) try {
							parsed = JSON.parse(oldDeviceDataStr);
							if (parsed.tokens) for (_c = 0, _d = Object.entries(parsed.tokens); _c < _d.length; _c++) {
								_e = _d[_c], k = _e[0], v = _e[1];
								if (k === "total" || k === "history") continue;
								if (typeof v === "number") oldDeviceTokens[k] = {
									total: v,
									in: v * .9,
									out: v * .1,
									cache_read: 0,
									cache_write: 0
								};
								else if (v && typeof v === "object") oldDeviceTokens[k] = v;
							}
						} catch (e) {}
						deviceTotal = Object.values(normalizedTokens).reduce(function(acc, val) {
							return acc + (val.total || 0);
						}, 0);
						normalizedTokens["total"] = deviceTotal;
						deviceData = {
							userId,
							name,
							image,
							tokens: normalizedTokens,
							updatedAt: (/* @__PURE__ */ new Date()).toISOString()
						};
						return [4, exports.kv.set("user:".concat(userId, ":device:").concat(deviceId, ":data"), JSON.stringify(deviceData))];
					case 2:
						_2.sent();
						now = Date.now();
						todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
						pipe = exports.kv.pipeline();
						hasTimeseriesEvents = false;
						if (!(historyData && Object.keys(historyData).length > 0)) return [3, 8];
						return [4, exports.kv.keys("user:".concat(userId, ":timeseries:*"))];
					case 3:
						keysToFilter = _2.sent();
						toolsInHistory_1 = /* @__PURE__ */ new Set();
						for (_f = 0, _g = Object.values(historyData); _f < _g.length; _f++) {
							toolsObj = _g[_f];
							Object.keys(toolsObj).forEach(function(t) {
								return toolsInHistory_1.add(t);
							});
						}
						_loop_1 = function(key) {
							var rawEvents, events, filteredEvents, pipeline_1;
							return __generator(this, function(_3) {
								switch (_3.label) {
									case 0: return [4, exports.kv.lrange(key, 0, -1)];
									case 1:
										rawEvents = _3.sent();
										events = rawEvents.map(function(str) {
											return typeof str === "string" ? JSON.parse(str) : str;
										});
										filteredEvents = events.filter(function(e) {
											return !(toolsInHistory_1.has(e.tool) && e.deviceId === deviceId);
										});
										return [4, exports.kv.del(key)];
									case 2:
										_3.sent();
										if (!(filteredEvents.length > 0)) return [3, 4];
										pipeline_1 = exports.kv.pipeline();
										filteredEvents.forEach(function(e) {
											return pipeline_1.rpush(key, JSON.stringify(e));
										});
										pipeline_1.expire(key, 2678400);
										return [4, pipeline_1.exec()];
									case 3:
										_3.sent();
										_3.label = 4;
									case 4: return [2];
								}
							});
						};
						_h = 0, keysToFilter_1 = keysToFilter;
						_2.label = 4;
					case 4:
						if (!(_h < keysToFilter_1.length)) return [3, 7];
						key = keysToFilter_1[_h];
						return [5, _loop_1(key)];
					case 5:
						_2.sent();
						_2.label = 6;
					case 6:
						_h++;
						return [3, 4];
					case 7:
						for (_j = 0, _k = Object.entries(historyData); _j < _k.length; _j++) {
							_l = _k[_j], dateStr = _l[0], toolsObj = _l[1];
							for (_m = 0, _o = Object.entries(toolsObj); _m < _o.length; _m++) {
								_p = _o[_m], tool = _p[0], val = _p[1];
								if (val <= 0) continue;
								model = "unknown";
								cacheRate = .5;
								if (tool === "cursor" || tool === "codex" || tool === "codex_proxy") {
									model = "gpt-5.6-sol";
									cacheRate = .93;
								} else if (tool === "antigravity") {
									model = "gemini-2.5-pro";
									cacheRate = .1;
								} else if (tool === "claude") {
									model = "claude-3-5-sonnet";
									cacheRate = .8;
								}
							}
						}
						_2.label = 8;
					case 8:
						for (_q = 0, _r = Object.entries(tokens); _q < _r.length; _q++) {
							_s = _r[_q], tool = _s[0], val = _s[1];
							if (tool === "total" || tool === "history") continue;
							oldVal = oldDeviceTokens[tool] || 0;
							delta = val - oldVal;
							model = "unknown";
							cacheRate = .5;
							if (tool === "cursor" || tool === "codex" || tool === "codex_proxy") {
								model = "gpt-5.6-sol";
								cacheRate = .93;
							} else if (tool === "antigravity") {
								model = "gemini-2.5-pro";
								cacheRate = .1;
							} else if (tool === "claude") {
								model = "claude-3-5-sonnet";
								cacheRate = .8;
							}
							toolHasHistory = false;
							if (historyData) for (_t = 0, _u = Object.values(historyData); _t < _u.length; _t++) {
								toolsObj = _u[_t];
								if (toolsObj[tool]) {
									toolHasHistory = true;
									break;
								}
							}
							if (toolHasHistory) {
								for (_v = 0, _w = Object.entries(historyData); _v < _w.length; _v++) {
									_x = _w[_v], dateStr = _x[0], toolsObj = _x[1];
									if (toolsObj[tool] && toolsObj[tool] > 0) {
										hVal = toolsObj[tool];
										event_1 = {
											timestamp: new Date(dateStr).getTime(),
											tool,
											model,
											tokens: hVal,
											cacheHit: Math.random() < cacheRate,
											deviceId
										};
										pipe.rpush("user:".concat(userId, ":timeseries:").concat(dateStr), JSON.stringify(event_1));
										pipe.expire("user:".concat(userId, ":timeseries:").concat(dateStr), 2678400);
									}
								}
								hasTimeseriesEvents = true;
							} else if (delta > 0 || val > 0 && oldVal === 0) {
								isFirstRun = oldVal === 0 && val > 0 || delta > 1e8;
								if (isFirstRun && val > 1e3) {
									days = 30;
									dailyAvg = Math.floor(val / days);
									for (i = 0; i < days; i++) {
										d = /* @__PURE__ */ new Date();
										d.setDate(d.getDate() - i);
										historyDateStr = d.toISOString().split("T")[0];
										tokensToLog = i === 0 ? dailyAvg + val % days : dailyAvg;
										event_2 = {
											timestamp: d.getTime(),
											tool,
											model,
											tokens: tokensToLog,
											cacheHit: Math.random() < cacheRate,
											deviceId
										};
										pipe.rpush("user:".concat(userId, ":timeseries:").concat(historyDateStr), JSON.stringify(event_2));
										pipe.expire("user:".concat(userId, ":timeseries:").concat(historyDateStr), 2678400);
									}
									hasTimeseriesEvents = true;
								} else {
									event_3 = {
										timestamp: now,
										tool,
										model,
										tokens: delta > 0 ? delta : val,
										cacheHit: Math.random() < cacheRate,
										deviceId
									};
									pipe.rpush("user:".concat(userId, ":timeseries:").concat(todayStr), JSON.stringify(event_3));
									pipe.expire("user:".concat(userId, ":timeseries:").concat(todayStr), 2678400);
									hasTimeseriesEvents = true;
								}
							}
						}
						if (!hasTimeseriesEvents) return [3, 10];
						return [4, pipe.exec()];
					case 9:
						_2.sent();
						_2.label = 10;
					case 10: return [4, exports.kv.keys("user:".concat(userId, ":device:*:data"))];
					case 11:
						deviceKeys = _2.sent();
						aggregatedTokens = {};
						if (!(deviceKeys.length > 0)) return [3, 13];
						return [4, exports.kv.mget(deviceKeys)];
					case 12:
						allDeviceData = _2.sent();
						for (_y = 0, allDeviceData_1 = allDeviceData; _y < allDeviceData_1.length; _y++) {
							dataStr = allDeviceData_1[_y];
							if (dataStr) try {
								parsed = JSON.parse(dataStr);
								if (parsed && parsed.tokens) for (_z = 0, _0 = Object.entries(parsed.tokens); _z < _0.length; _z++) {
									_1 = _0[_z], t = _1[0], v = _1[1];
									if (t === "total" || t === "history") continue;
									if (typeof v === "number") {
										if (!aggregatedTokens[t]) aggregatedTokens[t] = {
											total: 0,
											in: 0,
											out: 0,
											cache_read: 0,
											cache_write: 0
										};
										aggregatedTokens[t].total += v;
										aggregatedTokens[t].in += v * .9;
										aggregatedTokens[t].out += v * .1;
									} else if (v && typeof v === "object") {
										if (!aggregatedTokens[t]) aggregatedTokens[t] = {
											total: 0,
											in: 0,
											out: 0,
											cache_read: 0,
											cache_write: 0
										};
										objV = v;
										aggregatedTokens[t].total += objV.total || 0;
										aggregatedTokens[t].in += objV.in || 0;
										aggregatedTokens[t].out += objV.out || 0;
										aggregatedTokens[t].cache_read += objV.cache_read || 0;
										aggregatedTokens[t].cache_write += objV.cache_write || 0;
									}
								}
							} catch (e) {}
						}
						_2.label = 13;
					case 13:
						finalTotal = Object.values(aggregatedTokens).reduce(function(acc, val) {
							return acc + val.total;
						}, 0);
						aggregatedTokens["total"] = finalTotal;
						aggregatedData = {
							userId,
							name,
							image,
							tokens: aggregatedTokens,
							updatedAt: (/* @__PURE__ */ new Date()).toISOString()
						};
						return [4, exports.kv.set("user:".concat(userId, ":data"), JSON.stringify(aggregatedData))];
					case 14:
						_2.sent();
						return [4, exports.kv.zadd("leaderboard:total", finalTotal, userId)];
					case 15:
						_2.sent();
						return [2];
				}
			});
		});
	}
	function getLeaderboard() {
		return __awaiter(this, arguments, void 0, function(limit, time) {
			var userIds_3, keys, results, userIds, days, datesToFetch, i, d, targetDates, baseDataKeys, baseDataResults, userMap, pipe, _i, userIds_1, id, _a, targetDates_1, dateStr, tsResults, aggregatedList, resultIdx, _b, userIds_2, id, baseData, userTotal, tokens, i, _c, err, events, _d, events_1, evStr, ev, fallbackCache, freshTokens;
			if (limit === void 0) limit = 100;
			if (time === void 0) time = "all";
			return __generator(this, function(_e) {
				switch (_e.label) {
					case 0:
						if (!exports.kv) return [2, []];
						if (!(time === "all")) return [3, 3];
						return [4, exports.kv.zrevrange("leaderboard:total", 0, limit - 1)];
					case 1:
						userIds_3 = _e.sent();
						if (!userIds_3 || userIds_3.length === 0) return [2, []];
						keys = userIds_3.map(function(id) {
							return "user:".concat(id, ":data");
						});
						return [4, exports.kv.mget(keys)];
					case 2:
						results = _e.sent();
						return [2, results.filter(Boolean).map(function(res) {
							return JSON.parse(res);
						})];
					case 3: return [4, exports.kv.zrevrange("leaderboard:total", 0, limit > 0 ? limit - 1 : 99)];
					case 4:
						userIds = _e.sent();
						if (!userIds || userIds.length === 0) return [2, []];
						days = 1;
						if (time === "today") days = 1;
						else if (time === "yesterday") days = 2;
						else if (time === "3d") days = 3;
						else if (time === "7d") days = 7;
						else if (time === "30d") days = 30;
						else if (time === "90d") days = 90;
						datesToFetch = [];
						for (i = 0; i < days; i++) {
							d = /* @__PURE__ */ new Date();
							d.setDate(d.getDate() - i);
							datesToFetch.push(d.toISOString().split("T")[0]);
						}
						targetDates = datesToFetch;
						if (time === "yesterday") targetDates = [datesToFetch[1]];
						baseDataKeys = userIds.map(function(id) {
							return "user:".concat(id, ":data");
						});
						return [4, exports.kv.mget(baseDataKeys)];
					case 5:
						baseDataResults = _e.sent();
						userMap = {};
						userIds.forEach(function(id, idx) {
							if (baseDataResults[idx]) userMap[id] = JSON.parse(baseDataResults[idx]);
						});
						pipe = exports.kv.pipeline();
						for (_i = 0, userIds_1 = userIds; _i < userIds_1.length; _i++) {
							id = userIds_1[_i];
							for (_a = 0, targetDates_1 = targetDates; _a < targetDates_1.length; _a++) {
								dateStr = targetDates_1[_a];
								pipe.lrange("user:".concat(id, ":timeseries:").concat(dateStr), 0, -1);
							}
						}
						return [4, pipe.exec()];
					case 6:
						tsResults = _e.sent();
						aggregatedList = [];
						resultIdx = 0;
						for (_b = 0, userIds_2 = userIds; _b < userIds_2.length; _b++) {
							id = userIds_2[_b];
							baseData = userMap[id];
							if (!baseData) {
								resultIdx += targetDates.length;
								continue;
							}
							userTotal = 0;
							tokens = {};
							for (i = 0; i < targetDates.length; i++) {
								_c = tsResults[resultIdx++], err = _c[0], events = _c[1];
								if (!err && events && events.length > 0) for (_d = 0, events_1 = events; _d < events_1.length; _d++) {
									evStr = events_1[_d];
									try {
										ev = JSON.parse(evStr);
										if (!tokens[ev.tool]) tokens[ev.tool] = {
											total: 0,
											in: 0,
											out: 0,
											cache_read: 0,
											cache_write: 0
										};
										tokens[ev.tool].total += ev.tokens;
										if (ev.cacheReadTokens !== void 0) {
											tokens[ev.tool].in += ev.inTokens || 0;
											tokens[ev.tool].out += ev.outTokens || 0;
											tokens[ev.tool].cache_read += ev.cacheReadTokens || 0;
											tokens[ev.tool].cache_write += ev.cacheWriteTokens || 0;
										} else {
											fallbackCache = ev.tokens * .5;
											if (ev.tool === "cursor" || ev.tool === "codex" || ev.tool === "codex_proxy") fallbackCache = ev.tokens * .93;
											else if (ev.tool === "claude") fallbackCache = ev.tokens * .8;
											else if (ev.tool === "antigravity") fallbackCache = ev.tokens * .1;
											freshTokens = Math.max(0, ev.tokens - fallbackCache);
											tokens[ev.tool].in += freshTokens * .9;
											tokens[ev.tool].out += freshTokens * .1;
											tokens[ev.tool].cache_read += fallbackCache;
										}
										userTotal += ev.tokens;
									} catch (e) {}
								}
							}
							if (userTotal > 0) {
								tokens["total"] = userTotal;
								aggregatedList.push(__assign(__assign({}, baseData), { tokens }));
							}
						}
						aggregatedList.sort(function(a, b) {
							return b.tokens.total - a.tokens.total;
						});
						return [2, aggregatedList.slice(0, limit)];
				}
			});
		});
	}
	function getGlobalStats() {
		return __awaiter(this, arguments, void 0, function(leaderboardData) {
			var totalUsers_1, totalTokens_1, totalUsers, allScores, totalTokens, i;
			if (leaderboardData === void 0) leaderboardData = null;
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0:
						if (!exports.kv) return [2, {
							totalUsers: 0,
							totalTokens: 0
						}];
						if (leaderboardData) {
							totalUsers_1 = leaderboardData.length;
							totalTokens_1 = leaderboardData.reduce(function(acc, user) {
								return acc + (user.tokens.total || 0);
							}, 0);
							return [2, {
								totalUsers: totalUsers_1,
								totalTokens: totalTokens_1
							}];
						}
						return [4, exports.kv.zcard("leaderboard:total")];
					case 1:
						totalUsers = _a.sent();
						return [4, exports.kv.zrange("leaderboard:total", 0, -1, "WITHSCORES")];
					case 2:
						allScores = _a.sent();
						totalTokens = 0;
						for (i = 1; i < allScores.length; i += 2) totalTokens += Number(allScores[i]) || 0;
						return [2, {
							totalUsers,
							totalTokens
						}];
				}
			});
		});
	}
	function getUserAnalytics(userId_1) {
		return __awaiter(this, arguments, void 0, function(userId, days) {
			var dates, i, d, allEvents, pipe, results;
			if (days === void 0) days = 30;
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0:
						if (!exports.kv) return [2, []];
						dates = [];
						for (i = 0; i < days; i++) {
							d = /* @__PURE__ */ new Date();
							d.setDate(d.getDate() - i);
							dates.push(d.toISOString().split("T")[0]);
						}
						allEvents = [];
						pipe = exports.kv.pipeline();
						dates.forEach(function(dateStr) {
							pipe.lrange("user:".concat(userId, ":timeseries:").concat(dateStr), 0, -1);
						});
						return [4, pipe.exec()];
					case 1:
						results = _a.sent();
						if (results) results.forEach(function(_a) {
							var err = _a[0], res = _a[1];
							if (!err && Array.isArray(res)) res.forEach(function(item) {
								try {
									allEvents.push(JSON.parse(item));
								} catch (e) {}
							});
						});
						return [2, allEvents];
				}
			});
		});
	}
}));
//#endregion
export { require_kv as t };
